import * as vscode from 'vscode';
import * as path from 'path';
import { isMinRename } from './patternMatcher';
import { dialogController } from './dialogController';
import { fileOperations } from './fileOperations';
import { logger } from '../services/loggerService';
import { configService } from '../services/configService';
import { BULK_RENAME_THRESHOLD } from '../constants';
import type { RenameEvent } from '../types';

/**
 * Subscribes to vscode.workspace.onDidRenameFiles and filters events before
 * passing them to the pattern matcher and dialog controller.
 *
 * Responsibilities:
 *  - Reject folder renames.
 *  - Reject events for paths covered by ignoreGlobs.
 *  - Handle bulk renames (> BULK_RENAME_THRESHOLD) via summary notification.
 *  - Suppress self-triggered events (via fileOperations.isTagged).
 *  - Delegate single-file candidates to patternMatcher + dialogController.
 */
export class RenameInterceptor {
  private disposable: vscode.Disposable | undefined;

  /**
   * Registers the onDidRenameFiles listener.
   * Must be called once from extension activate().
   *
   * @param context - The extension context, used to push the disposable.
   */
  register(context: vscode.ExtensionContext): void {
    this.disposable = vscode.workspace.onDidRenameFiles((event) => {
      // Wrap in void to acknowledge the promise is intentionally not awaited at the event boundary.
      void this.handleRenameEvent(event);
    });
    context.subscriptions.push(this.disposable);
    logger.info('RenameInterceptor registered');
  }

  private async handleRenameEvent(event: vscode.FileRenameEvent): Promise<void> {
    const files = event.files as unknown as RenameEvent[];

    try {
      // Filter: only single-file non-folder renames; bulk → summary.
      const candidates = this.filterCandidates(files);

      if (candidates.length === 0) return;

      if (candidates.length > BULK_RENAME_THRESHOLD) {
        await this.handleBulkRename(candidates);
        return;
      }

      // Process each candidate independently.
      for (const { oldUri, newUri } of candidates) {
        await this.processSingleRename(oldUri.fsPath, newUri.fsPath);
      }
    } catch (err: unknown) {
      logger.error(
        'Unexpected error in rename event handler',
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }

  private filterCandidates(files: RenameEvent[]): RenameEvent[] {
    const enabledExts = configService.enabledLanguages;
    const ignoreGlobs = configService.ignoreGlobs;

    const candidates: RenameEvent[] = [];

    for (const rename of files) {
      const newPath = rename.newUri.fsPath;
      const oldPath = rename.oldUri.fsPath;

      // Skip if extension-tagged (self-triggered by this extension).
      if (fileOperations.isTagged(newPath) || fileOperations.isTagged(oldPath)) {
        logger.info('Skipping self-triggered rename', { path: newPath });
        continue;
      }

      // Skip folders (no extension on the new path that matches our list).
      const ext = path.extname(newPath).slice(1).toLowerCase();
      if (!ext) continue;

      // Skip ignored paths.
      if (this.isIgnored(newPath, ignoreGlobs)) continue;

      // Skip if extension not in enabled list.
      if (!enabledExts.includes(ext)) continue;

      candidates.push(rename);
    }

    return candidates;
  }

  private async processSingleRename(oldPath: string, newPath: string): Promise<void> {
    const enabledExts = configService.enabledLanguages;
    const match = isMinRename(oldPath, newPath, enabledExts);

    if (!match.isMatch) {
      logger.info('Rename does not match .min. pattern — ignoring', {
        from: path.basename(oldPath),
        to: path.basename(newPath),
      });
      return;
    }

    logger.info('Min rename detected', {
      from: path.basename(oldPath),
      to: path.basename(newPath),
      ext: match.extension,
    });

    await dialogController.show(newPath, oldPath, match);
  }

  private async handleBulkRename(renames: RenameEvent[]): Promise<void> {
    logger.warn('Bulk rename detected — skipping modal, showing summary', {
      count: renames.length,
    });

    const enabledExts = configService.enabledLanguages;
    const matchedNames = renames
      .filter((r) => isMinRename(r.oldUri.fsPath, r.newUri.fsPath, enabledExts).isMatch)
      .map((r) => path.basename(r.newUri.fsPath));

    if (matchedNames.length === 0) return;

    const picked = await vscode.window.showInformationMessage(
      `Minifyr: ${matchedNames.length} file(s) matched the .min. rename pattern. Open Output channel to review?`,
      'Show Output',
    );

    if (picked === 'Show Output') {
      logger.show();
    }

    matchedNames.forEach((name) => logger.info(`Bulk rename matched: ${name}`));
  }

  private isIgnored(filePath: string, globs: string[]): boolean {
    // Simple glob matching: check if any glob pattern appears as a substring segment.
    const target = process.platform === 'win32' ? filePath.toLowerCase() : filePath;
    return globs.some((glob) => {
      // Convert glob to a simple check: strip ** and check path includes the fixed segment.
      const segment = glob.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\//g, path.sep);
      const normSegment = process.platform === 'win32' ? segment.toLowerCase() : segment;
      return target.includes(normSegment);
    });
  }
}

/** Singleton RenameInterceptor instance. */
export const renameInterceptor = new RenameInterceptor();
