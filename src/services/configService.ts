import * as vscode from 'vscode';
import { CONFIG_SECTION } from '../constants';

/**
 * Typed accessor over vscode.workspace.getConfiguration('minifyr').
 * All settings have sane defaults; the extension is functional with zero user config.
 */
export class ConfigService {
  /**
   * File extensions that trigger detection when renamed to *.min.<ext>.
   */
  get enabledLanguages(): string[] {
    return this.get<string[]>('enabledLanguages', ['js', 'jsx', 'mjs', 'cjs', 'css']);
  }

  /**
   * Whether to always emit a .map file alongside the minified output.
   */
  get alwaysGenerateSourceMaps(): boolean {
    return this.get<boolean>('alwaysGenerateSourceMaps', true);
  }

  /**
   * Whether to offer import/require reference rewriting after a successful minify.
   */
  get autoUpdateReferences(): boolean {
    return this.get<boolean>('autoUpdateReferences', false);
  }

  /**
   * File size in KB above which an extra confirmation is shown before minifying.
   */
  get sizeWarningThresholdKb(): number {
    return this.get<number>('sizeWarningThresholdKb', 500);
  }

  /**
   * Glob patterns for paths that are never watched by the extension.
   */
  get ignoreGlobs(): string[] {
    return this.get<string[]>('ignoreGlobs', ['**/node_modules/**', '**/dist/**']);
  }

  /**
   * esbuild compile target string (e.g. 'es2019', 'esnext').
   */
  get esbuildTarget(): string {
    return this.get<string>('esbuildTarget', 'es2019');
  }

  private get<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return config.get<T>(key, defaultValue);
  }
}

/** Singleton config service instance. */
export const configService = new ConfigService();
