import type { Minifier } from './minifier.interface';
import { esbuildAdapter } from './esbuildAdapter';
import { lightningCssAdapter } from './lightningCssAdapter';

/**
 * Maps file extensions to their registered Minifier adapters.
 *
 * To add support for a new language (e.g. HTML, JSON, TypeScript):
 *  1. Create a new adapter implementing the Minifier interface.
 *  2. Add one entry to `ADAPTERS` below.
 *  Zero changes are required in core/, services/, or extension.ts.
 */
const ADAPTERS: readonly Minifier[] = [esbuildAdapter, lightningCssAdapter];

/**
 * Provides extension-to-adapter resolution.
 */
export class EngineRegistry {
  private readonly registry: Map<string, Minifier>;

  constructor(adapters: readonly Minifier[] = ADAPTERS) {
    this.registry = new Map();
    for (const adapter of adapters) {
      for (const ext of adapter.supportedExtensions) {
        this.registry.set(ext.toLowerCase(), adapter);
      }
    }
  }

  /**
   * Resolves the Minifier for the given file extension.
   *
   * @param ext - Lowercase extension without dot (e.g. 'js', 'css').
   * @returns The matching Minifier, or undefined if not registered.
   */
  resolve(ext: string): Minifier | undefined {
    return this.registry.get(ext.toLowerCase());
  }

  /**
   * Returns all registered extensions.
   */
  registeredExtensions(): string[] {
    return [...this.registry.keys()];
  }
}

/** Singleton registry with the default adapter set. */
export const engineRegistry = new EngineRegistry();
