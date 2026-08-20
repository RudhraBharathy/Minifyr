import type { MinifyOptions, MinifyResult } from '../types';

/**
 * Contract every minification engine adapter must implement.
 *
 * Design constraints:
 *  - Adapters are NOT aware of VS Code APIs, dialogs, or output channels.
 *  - Adapters only receive the content string and a file path for source-map naming.
 *  - New language support = new adapter implementing this interface + one line in engineRegistry.
 */
export interface Minifier {
  /** Lowercase extensions this adapter handles (without dot), e.g. ['js','jsx','mjs','cjs']. */
  readonly supportedExtensions: readonly string[];

  /**
   * Minifies the given content string.
   *
   * @param content - The raw source code as a string.
   * @param options - Minification options including source map and target settings.
   * @returns A promise resolving to the minified code, optional source map, and any warnings.
   * @throws An Error with a user-readable message if minification fails (e.g. syntax error).
   */
  minify(content: string, options: MinifyOptions): Promise<MinifyResult>;
}
