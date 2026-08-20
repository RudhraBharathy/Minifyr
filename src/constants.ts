/**
 * Extension-wide constants: supported extensions, config keys, timing, etc.
 */

/** Extensions the extension can minify in v1. */
export const SUPPORTED_EXTENSIONS = ['js', 'jsx', 'mjs', 'cjs', 'css'] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

/** The canonical infix that triggers detection (lowercase). */
export const MIN_INFIX = '.min.';

/** VS Code configuration section name. */
export const CONFIG_SECTION = 'minifyr';

/** Output channel name shown in VS Code. */
export const OUTPUT_CHANNEL_NAME = 'Minifyr';

/** Milliseconds before we expire an operation tag (prevents stuck ignore loops). */
export const OPERATION_TAG_TTL_MS = 5_000;

/** Minification timeout in milliseconds — engine calls that exceed this are aborted. */
export const ENGINE_TIMEOUT_MS = 30_000;

/** Bulk rename threshold: more than this many files in one event → summary notification instead of modal. */
export const BULK_RENAME_THRESHOLD = 3;
