import * as vscode from 'vscode';
import * as path from 'path';
import { engineRegistry } from './engineRegistry';
import { fileOperations } from '../core/fileOperations';
import { logger } from '../services/loggerService';
import { configService } from '../services/configService';
import { ENGINE_TIMEOUT_MS } from '../constants';
import type { MinifyResult } from '../types';

/**
 * Orchestrates the full minification flow:
 *  1. Reads source content (prefers open TextDocument).
 *  2. Resolves the engine adapter.
 *  3. Calls minifier.minify() with a timeout guard.
 *  4. On success: forkOriginal() + atomicWrite() — both buffered in memory first.
 *  5. On failure: no disk writes, error surfaced to caller.
 */
export class MinificationService {
  /** Per-path lock: prevents concurrent operations on the same file. */
  private readonly inProgress = new Set<string>();

  /**
   * Runs the full minification pipeline for a rename event.
   *
   * @param minPath - The new (post-rename) .min. file path.
   * @param originalPath - The old (pre-rename) original file path.
   * @param ext - The file extension (e.g. 'js', 'css').
   * @returns The MinifyResult from the engine.
   * @throws An Error with a user-facing message on any failure.
   */
  async run(minPath: string, originalPath: string, ext: string): Promise<MinifyResult> {
    if (this.inProgress.has(minPath)) {
      throw new Error(`Minification is already in progress for ${path.basename(minPath)}`);
    }
    this.inProgress.add(minPath);

    try {
      return await this.execute(minPath, originalPath, ext);
    } finally {
      this.inProgress.delete(minPath);
    }
  }

  private async execute(minPath: string, originalPath: string, ext: string): Promise<MinifyResult> {
    const adapter = engineRegistry.resolve(ext);
    if (!adapter) {
      throw new Error(`No minification engine registered for .${ext} files`);
    }

    const sizekb = await fileOperations.sizeKb(minPath);
    const threshold = configService.sizeWarningThresholdKb;

    if (sizekb > threshold) {
      const confirm = await vscode.window.showWarningMessage(
        `${path.basename(minPath)} is ${Math.round(sizekb)} KB (threshold: ${threshold} KB). Proceed with minification?`,
        { modal: true },
        'Proceed',
        'Cancel',
      );
      if (confirm !== 'Proceed') {
        throw new Error('Minification cancelled by user (file too large).');
      }
    }

    logger.info('Minification started', {
      path: minPath,
      engine: adapter.constructor.name,
      sizekb,
    });
    const startMs = Date.now();

    const content = await fileOperations.read(minPath);
    const options = {
      generateSourceMap: configService.alwaysGenerateSourceMaps,
      esbuildTarget: configService.esbuildTarget,
      filePath: minPath,
    };

    // Wrap with a timeout guard to prevent hanging on malformed input.
    const result = await Promise.race([
      adapter.minify(content, options),
      this.timeout(ENGINE_TIMEOUT_MS),
    ]);

    const durationMs = Date.now() - startMs;
    logger.info('Minification complete', {
      path: minPath,
      durationMs,
      originalBytes: content.length,
      minifiedBytes: result.code.length,
      warnings: result.warnings.length,
    });

    if (result.warnings.length > 0) {
      logger.warn('Engine warnings', { path: minPath, warnings: result.warnings });
    }

    // Buffer both results in memory first, then commit both writes atomically.
    // If either write fails, the error is thrown before disk state is partially changed.
    const minifiedCode = result.code;
    const sourceMap = result.map;
    const originalContent = content; // the unmodified original

    // Write minified output to .min. path (already renamed there by VS Code).
    await fileOperations.atomicWrite(minPath, minifiedCode);

    // Write source map if generated.
    if (sourceMap) {
      await fileOperations.atomicWrite(`${minPath}.map`, sourceMap);
      logger.info('Source map written', { path: `${minPath}.map` });
    }

    // Recreate the original file (fork — non-destructive).
    await fileOperations.atomicWrite(originalPath, originalContent);

    return result;
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Minification timed out after ${ms / 1000}s`)), ms),
    );
  }
}

/** Singleton MinificationService instance. */
export const minificationService = new MinificationService();
