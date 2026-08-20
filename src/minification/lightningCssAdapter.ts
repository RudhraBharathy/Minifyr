import type { Minifier } from './minifier.interface';
import type { MinifyOptions, MinifyResult } from '../types';

/**
 * Minification adapter for CSS files using Lightning CSS WebAssembly.
 * Uses official lightningcss-wasm for universal cross-platform execution across all operating systems.
 */
export class LightningCssAdapter implements Minifier {
  readonly supportedExtensions: readonly string[] = ['css'];

  /**
   * Minifies CSS content using lightningcss-wasm.
   *
   * @param content - Raw CSS source string.
   * @param options - Includes generateSourceMap and filePath.
   * @returns Minified CSS string, optional source map, and any warnings.
   * @throws An Error with a user-readable message on CSS parse failure.
   */
  async minify(content: string, options: MinifyOptions): Promise<MinifyResult> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lightningcss = await import('lightningcss-wasm');

    const encoded = Buffer.from(content, 'utf8');

    try {
      const result = lightningcss.transform({
        filename: options.filePath,
        code: encoded,
        minify: true,
        sourceMap: options.generateSourceMap,
      });

      const warnings: string[] = result.warnings.map(
        (w: { message: string; loc?: { line: number; column: number } }) =>
          `${w.message}${w.loc ? ` (line ${w.loc.line})` : ''}`,
      );

      return {
        code: Buffer.from(result.code).toString('utf8'),
        map: result.map ? Buffer.from(result.map).toString('utf8') : undefined,
        warnings,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`lightningcss error: ${err.message}`);
      }
      throw new Error(`lightningcss error: Unknown failure`);
    }
  }
}

/** Singleton instance registered in EngineRegistry. */
export const lightningCssAdapter = new LightningCssAdapter();
