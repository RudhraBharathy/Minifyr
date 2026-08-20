import * as assert from 'assert';
import { isMinRename, extractMinExtension, deriveBaseName } from '../../src/core/patternMatcher';

const ENABLED_EXTS = ['js', 'jsx', 'mjs', 'cjs', 'css'];

describe('patternMatcher — isMinRename', () => {
  // --- Happy path ---
  it('detects a valid JS .min. rename', () => {
    const result = isMinRename('/workspace/main.js', '/workspace/main.min.js', ENABLED_EXTS);
    assert.strictEqual(result.isMatch, true);
    assert.strictEqual(result.extension, 'js');
    assert.strictEqual(result.baseName, 'main');
  });

  it('detects a valid CSS .min. rename', () => {
    const result = isMinRename('/workspace/styles.css', '/workspace/styles.min.css', ENABLED_EXTS);
    assert.strictEqual(result.isMatch, true);
    assert.strictEqual(result.extension, 'css');
    assert.strictEqual(result.baseName, 'styles');
  });

  it('detects a valid JSX .min. rename', () => {
    const result = isMinRename('/workspace/App.jsx', '/workspace/App.min.jsx', ENABLED_EXTS);
    assert.strictEqual(result.isMatch, true);
    assert.strictEqual(result.extension, 'jsx');
  });

  it('detects a valid MJS .min. rename', () => {
    const result = isMinRename('/workspace/mod.mjs', '/workspace/mod.min.mjs', ENABLED_EXTS);
    assert.strictEqual(result.isMatch, true);
  });

  it('detects a valid CJS .min. rename', () => {
    const result = isMinRename('/workspace/lib.cjs', '/workspace/lib.min.cjs', ENABLED_EXTS);
    assert.strictEqual(result.isMatch, true);
  });

  // --- No-match cases ---
  it('rejects when new name does not have .min. infix', () => {
    const result = isMinRename('/workspace/main.js', '/workspace/main.bundle.js', ENABLED_EXTS);
    assert.strictEqual(result.isMatch, false);
  });

  it('rejects when extension is not in enabled list', () => {
    const result = isMinRename('/workspace/index.html', '/workspace/index.min.html', ENABLED_EXTS);
    assert.strictEqual(result.isMatch, false);
  });

  it('rejects .min.min. loop — old file already has .min.', () => {
    const result = isMinRename(
      '/workspace/main.min.js',
      '/workspace/main.min.min.js',
      ENABLED_EXTS,
    );
    assert.strictEqual(result.isMatch, false);
  });

  it('rejects when base names do not match', () => {
    const result = isMinRename('/workspace/main.js', '/workspace/other.min.js', ENABLED_EXTS);
    assert.strictEqual(result.isMatch, false);
  });

  it('handles different directories correctly', () => {
    const result = isMinRename(
      '/workspace/src/utils.js',
      '/workspace/dist/utils.min.js',
      ENABLED_EXTS,
    );
    // Base names still match (both 'utils')
    assert.strictEqual(result.isMatch, true);
  });

  it('is case-insensitive for extension matching', () => {
    const result = isMinRename('/workspace/App.JS', '/workspace/App.min.JS', ENABLED_EXTS);
    assert.strictEqual(result.isMatch, true);
    assert.strictEqual(result.extension, 'js');
  });
});

describe('patternMatcher — extractMinExtension', () => {
  it('returns extension for valid .min. suffix', () => {
    assert.strictEqual(extractMinExtension('main.min.js', ENABLED_EXTS), 'js');
    assert.strictEqual(extractMinExtension('styles.min.css', ENABLED_EXTS), 'css');
  });

  it('returns null for file without .min. infix', () => {
    assert.strictEqual(extractMinExtension('main.js', ENABLED_EXTS), null);
    assert.strictEqual(extractMinExtension('main.bundle.js', ENABLED_EXTS), null);
  });

  it('returns null when extension not in enabled list', () => {
    assert.strictEqual(extractMinExtension('page.min.html', ENABLED_EXTS), null);
  });

  it('returns null for bare .min.<ext> with no base', () => {
    // '.min.js' alone — no base name before it
    assert.strictEqual(extractMinExtension('.min.js', ENABLED_EXTS), null);
  });
});

describe('patternMatcher — deriveBaseName', () => {
  it('extracts base name from .min.js filename', () => {
    assert.strictEqual(deriveBaseName('main.min.js', 'js'), 'main');
  });

  it('extracts base name with dots in it', () => {
    assert.strictEqual(deriveBaseName('my.app.min.js', 'js'), 'my.app');
  });

  it('extracts base name from .min.css filename', () => {
    assert.strictEqual(deriveBaseName('styles.min.css', 'css'), 'styles');
  });
});
