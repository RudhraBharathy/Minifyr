/**
 * Shared interfaces and types for the Minifyr extension.
 */

/** Result of checking whether a rename matches the .min. convention. */
export interface MatchResult {
  /** Whether the rename matches the .min. pattern. */
  isMatch: boolean;
  /** The file extension of the new file (e.g. 'js', 'css'), if matched. */
  extension?: string;
  /** The base name before .min. (e.g. 'main' from 'main.min.js'), if matched. */
  baseName?: string;
}

/** Options passed into a Minifier's minify() call. */
export interface MinifyOptions {
  /** Whether to generate a source map. */
  generateSourceMap: boolean;
  /** The esbuild target (only relevant for JS engines). */
  esbuildTarget: string;
  /** The absolute file path, used for source map naming. */
  filePath: string;
}

/** Result returned from a Minifier's minify() call. */
export interface MinifyResult {
  /** The minified code as a string. */
  code: string;
  /** The inline or external source map, if generated. */
  map?: string;
  /** Non-fatal warnings from the engine. */
  warnings: string[];
}

/** A rename event pair as provided by VS Code's onDidRenameFiles. */
export interface RenameEvent {
  oldUri: { fsPath: string };
  newUri: { fsPath: string };
}

/** Possible user responses from the minification dialog. */
export type DialogAction = 'minify' | 'keepRename' | 'cancel';

/** State tracked per in-progress or completed operation, used to prevent feedback loops. */
export interface OperationTag {
  /** The absolute path being written/renamed by the extension itself. */
  path: string;
  /** Timestamp the tag was created — used to expire stale tags. */
  createdAt: number;
}
