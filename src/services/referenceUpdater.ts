import * as vscode from 'vscode';
import * as path from 'path';
import { logger } from './loggerService';

/**
 * Optional, fully decoupled import/require/src reference rewriter.
 * Invoked only as a follow-up prompt after a successful Minify — never inline with the core flow.
 *
 * Phase: post-v1-core (present but gated behind autoUpdateReferences setting).
 */
export class ReferenceUpdater {
  /**
   * Scans the workspace for references to `oldPath` and offers to rewrite them
   * to point to `newPath` via a QuickPick review step before touching any files.
   *
   * @param oldPath - The original file path (before rename).
   * @param newPath - The new .min. file path.
   */
  async offerUpdate(oldPath: string, newPath: string): Promise<void> {
    try {
      const oldName = path.basename(oldPath);
      const newName = path.basename(newPath);

      logger.info('Scanning for references to update', { oldPath, newPath });

      // Search workspace for references to the old filename.
      const matches = await this.findReferences(oldName);

      if (matches.length === 0) {
        logger.info('No references found to update', { oldName });
        return;
      }

      // Present a QuickPick for user to review matches before any writes.
      const items: vscode.QuickPickItem[] = matches.map((loc) => ({
        label: `$(file) ${vscode.workspace.asRelativePath(loc.uri)}`,
        description: `Line ${loc.range.start.line + 1}`,
        detail: loc.text,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Found ${matches.length} reference(s) to "${oldName}". Select all to rewrite to "${newName}":`,
        canPickMany: true,
        title: 'Minifyr — Update References',
      });

      if (!selected || selected.length === 0) {
        logger.info('User cancelled reference update');
        return;
      }

      // Rewrite selected references.
      const selectedIndices = new Set(selected.map((s) => items.indexOf(s)));
      const toUpdate = matches.filter((_, i) => selectedIndices.has(i));

      const edit = new vscode.WorkspaceEdit();
      for (const loc of toUpdate) {
        edit.replace(loc.uri, loc.range, loc.text.replace(oldName, newName));
      }

      const success = await vscode.workspace.applyEdit(edit);
      if (success) {
        void vscode.window.showInformationMessage(
          `Minifyr: Updated ${toUpdate.length} reference(s) to "${newName}".`,
        );
        logger.info('References updated', { count: toUpdate.length, newName });
      } else {
        void vscode.window.showWarningMessage('Minifyr: Some reference updates failed.');
      }
    } catch (err: unknown) {
      logger.error('Reference update failed', err instanceof Error ? err : new Error(String(err)));
    }
  }

  private async findReferences(
    oldName: string,
  ): Promise<Array<{ uri: vscode.Uri; range: vscode.Range; text: string }>> {
    const results: Array<{ uri: vscode.Uri; range: vscode.Range; text: string }> = [];

    // Use VS Code's built-in text search.
    await vscode.workspace.findFiles('**/*', '**/node_modules/**').then(async (files) => {
      for (const file of files) {
        const doc = await vscode.workspace.openTextDocument(file);
        const text = doc.getText();
        let idx = text.indexOf(oldName);
        while (idx !== -1) {
          const pos = doc.positionAt(idx);
          const endPos = doc.positionAt(idx + oldName.length);
          const lineText = doc.lineAt(pos.line).text;
          results.push({ uri: file, range: new vscode.Range(pos, endPos), text: lineText });
          idx = text.indexOf(oldName, idx + 1);
        }
      }
    });

    return results;
  }
}

/** Singleton ReferenceUpdater instance. */
export const referenceUpdater = new ReferenceUpdater();
