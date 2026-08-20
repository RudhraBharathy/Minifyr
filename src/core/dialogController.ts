import * as vscode from 'vscode';
import * as path from 'path';
import { fileOperations } from './fileOperations';
import { minificationService } from '../minification/minificationService';
import { logger } from '../services/loggerService';
import { configService } from '../services/configService';
import { referenceUpdater } from '../services/referenceUpdater';
import type { MatchResult } from '../types';

/**
 * Single source of truth for all user-facing dialog copy and UX.
 * Owns the modal flow for Cancel / Keep Rename / Minify actions.
 *
 * All user-facing strings are defined here to simplify future localization.
 */
export class DialogController {
  /**
   * Shows the minification modal for a matched rename event and handles the
   * user's choice by delegating to the appropriate service.
   *
   * @param newPath - The post-rename (`.min.`) file path.
   * @param oldPath - The pre-rename original file path.
   * @param match - The MatchResult from patternMatcher.
   */
  async show(newPath: string, oldPath: string, match: MatchResult): Promise<void> {
    const fileName = path.basename(newPath);
    const originalName = path.basename(oldPath);

    const picked = await vscode.window.showInformationMessage(
      `Minifyr: "${originalName}" was renamed to "${fileName}". Would you like to minify it?`,
      { modal: true },
      'Minify',
      'Keep Rename',
    );

    switch (picked) {
      case 'Minify':
        await this.handleMinify(newPath, oldPath, match);
        break;

      case 'Keep Rename':
        // User wants the rename but no minification — no-op.
        logger.info('User chose Keep Rename — no action taken', { path: newPath });
        break;

      case undefined:
      default:
        // Modal cancel button or dialog closed/escaped — revert rename.
        await this.handleCancel(newPath, oldPath);
        break;
    }
  }

  private async handleMinify(newPath: string, oldPath: string, match: MatchResult): Promise<void> {
    const fileName = path.basename(newPath);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Minifyr: Minifying ${fileName}…`,
        cancellable: false,
      },
      async () => {
        try {
          const result = await minificationService.run(newPath, oldPath, match.extension ?? '');

          const warnings =
            result.warnings.length > 0 ? ` (${result.warnings.length} warning(s))` : '';
          void vscode.window.showInformationMessage(`✅ Minified: ${fileName}${warnings}`);
          logger.info('Minification succeeded via dialog', { path: newPath });

          // Optionally offer reference updating.
          if (configService.autoUpdateReferences) {
            await referenceUpdater.offerUpdate(oldPath, newPath);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error('Minification failed', err instanceof Error ? err : new Error(message));
          void vscode.window.showErrorMessage(`Minifyr: ${message}`);
        }
      },
    );
  }

  private async handleCancel(newPath: string, oldPath: string): Promise<void> {
    try {
      await fileOperations.revertRename(newPath, oldPath);
      logger.info('Rename reverted via Cancel', { from: newPath, to: oldPath });
      void vscode.window.showInformationMessage(
        `Minifyr: Rename reverted — "${path.basename(oldPath)}" restored.`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Failed to revert rename', err instanceof Error ? err : new Error(message));
      void vscode.window.showErrorMessage(`Minifyr: Could not revert rename. ${message}`);
    }
  }
}

/** Singleton DialogController instance. */
export const dialogController = new DialogController();
