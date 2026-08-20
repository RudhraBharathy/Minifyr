import * as esbuild from 'esbuild-wasm';
import * as path from 'path';
import type { Minifier } from './minifier.interface';
import type { MinifyOptions, MinifyResult } from '../types';

/**
 * Minification adapter for JavaScript, JSX, MJS, and CJS files using esbuild WebAssembly.
 * Uses official esbuild-wasm for universal cross-platform execution across all operating systems.
 */
export class EsbuildAdapter implements Minifier {
  readonly supportedExtensions: readonly string[] = ['js', 'jsx', 'mjs', 'cjs'];

  /**
   * Minifies JS-family content using esbuild.
   *
   * @param content - Raw source code string.
   * @param options - Includes generateSourceMap, esbuildTarget, filePath.
   * @returns Minified code plus optional source map and any engine warnings.
   * @throws An Error with the first esbuild error message on parse/transform failure.
   */
  async minify(content: string, options: MinifyOptions): Promise<MinifyResult> {
    const ext = path.extname(options.filePath).slice(1).toLowerCase();
    const loader = this.resolveLoader(ext);

    let result: esbuild.TransformResult;
    try {
      result = await esbuild.transform(content, {
        minify: true,
        sourcemap: options.generateSourceMap ? 'external' : false,
        target: options.esbuildTarget,
        loader,
        sourcefile: options.filePath,
      });
    } catch (err: unknown) {
      // esbuild throws a BuildFailure object with an errors array on parse/transform failure.
      if (err && typeof err === 'object' && 'errors' in err) {
        const errors = (
          err as { errors: Array<{ text: string; location?: { line: number; column: number } }> }
        ).errors;
        const first = errors[0];
        const location = first?.location
          ? ` (line ${first.location.line}, column ${first.location.column})`
          : '';
        throw new Error(`esbuild error: ${first?.text ?? 'Unknown error'}${location}`);
      }
      throw new Error(`esbuild error: ${err instanceof Error ? err.message : String(err)}`);
    }

    const warnings = result.warnings.map(
      (w) => w.text + (w.location ? ` (line ${w.location.line})` : ''),
    );

    return {
      code: result.code,
      map: result.map || undefined,
      warnings,
    };
  }

  private resolveLoader(ext: string): esbuild.Loader {
    switch (ext) {
      case 'jsx':
        return 'jsx';
      case 'mjs':
      case 'cjs':
        return 'js';
      default:
        return 'js';
    }
  }
}

/** Singleton instance registered in EngineRegistry. */
export const esbuildAdapter = new EsbuildAdapter();
