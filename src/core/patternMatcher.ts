import * as path from 'path';
import { MIN_INFIX } from '../constants';
import type { MatchResult } from '../types';

/**
 * Pure, framework-free functions for matching the .min. rename convention.
 * This module is the most heavily unit-tested in the codebase.
 */

/**
 * Checks whether a rename from `oldPath` to `newPath` represents a valid .min. rename.
 *
 * Rules:
 *  1. The new filename must end with `.min.<ext>`.
 *  2. The old filename must NOT already match `.min.<ext>` (prevents `.min.min.` loops).
 *  3. The base name before `.min.` in the new file must match the base of the old file.
 *     e.g. `main.js` → `main.min.js` ✅, `main.js` → `other.min.js` ❌
 *
 * @param oldPath - The absolute or relative path before the rename.
 * @param newPath - The absolute or relative path after the rename.
 * @param enabledExtensions - Lowercase extensions without dot (e.g. ['js','css']).
 * @returns A MatchResult indicating whether this is a valid .min. rename.
 */
export function isMinRename(
  oldPath: string,
  newPath: string,
  enabledExtensions: string[],
): MatchResult {
  const oldName = path.basename(oldPath);
  const newName = path.basename(newPath);

  // New name must end with .min.<ext>
  const matchedExt = extractMinExtension(newName, enabledExtensions);
  if (matchedExt === null) {
    return { isMatch: false };
  }

  // Old name must NOT already be a .min. file (no feedback loops)
  const alreadyMin = extractMinExtension(oldName, enabledExtensions);
  if (alreadyMin !== null) {
    return { isMatch: false };
  }

  // The base before .min. must match the old file's base (without extension).
  // Both sides normalized to lowercase for case-insensitive comparison.
  const expectedBase = deriveBaseName(newName.toLowerCase(), matchedExt);
  const oldBase = path.basename(oldName.toLowerCase(), `.${matchedExt}`);
  if (expectedBase !== oldBase) {
    return { isMatch: false };
  }

  return {
    isMatch: true,
    extension: matchedExt,
    baseName: expectedBase,
  };
}

/**
 * Returns the extension of a file if it matches `<something>.min.<supportedExt>`,
 * or null if it doesn't match.
 *
 * @param filename - Just the file basename (not the full path).
 * @param enabledExtensions - Lowercase extensions without dot.
 */
export function extractMinExtension(filename: string, enabledExtensions: string[]): string | null {
  const lower = filename.toLowerCase();
  for (const ext of enabledExtensions) {
    const suffix = `${MIN_INFIX}${ext}`;
    if (lower.endsWith(suffix) && lower !== suffix) {
      return ext;
    }
  }
  return null;
}

/**
 * Derives the base name before `.min.<ext>` in a filename.
 *
 * @param filename - A filename already confirmed to end with `.min.<ext>`.
 * @param ext - The matched extension (lowercase, no dot).
 * @returns The base name, e.g. 'main' from 'main.min.js'.
 */
export function deriveBaseName(filename: string, ext: string): string {
  // Strip .<ext> from the end, leaving e.g. 'main.min'
  const withoutExt = filename.slice(0, filename.length - ext.length - 1); // removes '.<ext>'
  // Strip trailing '.min' (the infix without its trailing dot, which was the ext separator)
  const minSuffix = '.min';
  return withoutExt.slice(0, withoutExt.length - minSuffix.length); // removes '.min'
}
