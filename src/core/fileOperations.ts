import * as vscode from 'vscode';
import * as path from 'path';
import { OPERATION_TAG_TTL_MS } from '../constants';
import { logger } from '../services/loggerService';
import type { OperationTag } from '../types';

/**
 * All VS Code filesystem mutations go through this module — nowhere else in the codebase
 * calls vscode.workspace.fs directly.
 *
 * Key guarantees:
 *  - atomicWrite: write via temp file + rename to prevent corruption on crash.
 *  - revertRename: tags the operation so renameInterceptor ignores the resulting event.
 *  - forkOriginal: recreates the original file so "Minify" is non-destructive.
 */
export class FileOperations {
  /** Active operation tags keyed by path. Expires after OPERATION_TAG_TTL_MS. */
  private readonly activeTags = new Map<string, OperationTag>();

  /**
   * Writes `content` to `targetPath` atomically by first writing to a `.tmp` file,
   * then renaming it over the target. Prevents corrupted files if the process crashes mid-write.
   *
   * @param targetPath - Absolute path to write.
   * @param content - Content as a UTF-8 string.
   * @throws If either the temp write or rename fails.
   */
  async atomicWrite(targetPath: string, content: string): Promise<void> {
    const tmpPath = `${targetPath}.tmp`;
    const tmpUri = vscode.Uri.file(tmpPath);
    const targetUri = vscode.Uri.file(targetPath);
    const encoded = Buffer.from(content, 'utf8');

    this.tagOperation(tmpPath);
    this.tagOperation(targetPath);

    try {
      await vscode.workspace.fs.writeFile(tmpUri, encoded);
      await vscode.workspace.fs.rename(tmpUri, targetUri, { overwrite: true });
      logger.info('atomicWrite succeeded', { path: targetPath, bytes: encoded.length });
    } catch (err) {
      // Attempt cleanup of the temp file — best effort, do not throw on cleanup failure.
      try {
        await vscode.workspace.fs.delete(tmpUri, { useTrash: false });
      } catch {
        // ignore cleanup error
      }
      throw err;
    }
  }

  /**
   * Reads the file at `filePath` as a UTF-8 string.
   * Prefers the live TextDocument buffer when the file is open in an editor,
   * falling back to disk for unopened files.
   *
   * @param filePath - Absolute path to read.
   * @returns The file content as a string.
   * @throws If the file cannot be read.
   */
  async read(filePath: string): Promise<string> {
    const uri = vscode.Uri.file(filePath);

    // Prefer open TextDocument to avoid stale disk reads for files with unsaved changes.
    const normTarget = this.normalizePath(filePath);
    const openDoc = vscode.workspace.textDocuments.find(
      (d) => this.normalizePath(d.uri.fsPath) === normTarget,
    );
    if (openDoc) {
      return openDoc.getText();
    }

    const bytes = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(bytes).toString('utf8');
  }

  /**
   * Returns the file size in kilobytes. Returns 0 if the stat fails.
   *
   * @param filePath - Absolute path.
   */
  async sizeKb(filePath: string): Promise<number> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return stat.size / 1024;
    } catch {
      return 0;
    }
  }

  /**
   * Reverts a rename by renaming `newPath` back to `oldPath`.
   * Tags both paths so renameInterceptor ignores the resulting event.
   *
   * @param newPath - The current (post-rename) absolute path.
   * @param oldPath - The desired (pre-rename) absolute path.
   * @throws If the rename back fails.
   */
  async revertRename(newPath: string, oldPath: string): Promise<void> {
    this.tagOperation(newPath);
    this.tagOperation(oldPath);
    await vscode.workspace.fs.rename(vscode.Uri.file(newPath), vscode.Uri.file(oldPath), {
      overwrite: false,
    });
    logger.info('Rename reverted', { from: newPath, to: oldPath });
  }

  /**
   * Recreates the original file at `originalPath` by copying content from `minPath`.
   * This makes "Minify" a fork (non-destructive) rather than an in-place replacement.
   *
   * @param minPath - The renamed .min. file to read content from.
   * @param originalPath - The path to recreate the original file at.
   * @throws If the read or write fails.
   */
  async forkOriginal(minPath: string, originalPath: string): Promise<void> {
    const content = await this.read(minPath);
    await this.atomicWrite(originalPath, content);
    logger.info('Original forked', { from: minPath, to: originalPath });
  }

  /**
   * Checks whether a path has been tagged as an in-progress extension operation.
   * Used by renameInterceptor to suppress self-triggered events.
   *
   * @param filePath - Absolute path to check.
   */
  isTagged(filePath: string): boolean {
    const norm = this.normalizePath(filePath);
    const tag = this.activeTags.get(norm);
    if (!tag) return false;
    if (Date.now() - tag.createdAt > OPERATION_TAG_TTL_MS) {
      this.activeTags.delete(norm);
      return false;
    }
    return true;
  }

  /**
   * Constructs the original file path from a .min. path.
   * e.g. `/workspace/main.min.js` → `/workspace/main.js`
   *
   * @param minPath - The .min. file path.
   * @param ext - The file extension (e.g. 'js').
   * @param baseName - The base name (e.g. 'main').
   */
  originalPathFrom(minPath: string, ext: string, baseName: string): string {
    const dir = path.dirname(minPath);
    return path.join(dir, `${baseName}.${ext}`);
  }

  private tagOperation(filePath: string): void {
    const norm = this.normalizePath(filePath);
    this.activeTags.set(norm, { path: filePath, createdAt: Date.now() });
    // Auto-expire tag after TTL to prevent memory leaks.
    setTimeout(() => this.activeTags.delete(norm), OPERATION_TAG_TTL_MS + 100);
  }

  private normalizePath(filePath: string): string {
    const normalized = path.normalize(filePath);
    return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
  }
}

/** Singleton FileOperations instance. */
export const fileOperations = new FileOperations();
