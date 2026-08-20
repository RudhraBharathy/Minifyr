import * as assert from 'assert';
import { ConfigService } from '../../src/services/configService';

/**
 * Unit tests for ConfigService defaults.
 * Note: Since this module depends on vscode.workspace.getConfiguration, we test
 * the default fallback values (the second argument to config.get()) which define
 * the zero-config behavior contract.
 */
describe('ConfigService — default values', () => {
  // We verify defaults match the spec in §9 of the implementation plan.
  it('enabledLanguages default includes all v1 extensions', () => {
    const cs = new ConfigService();
    // In test env (no VS Code), config.get returns the default.
    const exts = cs.enabledLanguages;
    assert.deepStrictEqual(exts, ['js', 'jsx', 'mjs', 'cjs', 'css']);
  });

  it('alwaysGenerateSourceMaps default is true', () => {
    const cs = new ConfigService();
    assert.strictEqual(cs.alwaysGenerateSourceMaps, true);
  });

  it('autoUpdateReferences default is false', () => {
    const cs = new ConfigService();
    assert.strictEqual(cs.autoUpdateReferences, false);
  });

  it('sizeWarningThresholdKb default is 500', () => {
    const cs = new ConfigService();
    assert.strictEqual(cs.sizeWarningThresholdKb, 500);
  });

  it('ignoreGlobs default includes node_modules and dist', () => {
    const cs = new ConfigService();
    const globs = cs.ignoreGlobs;
    assert.ok(globs.includes('**/node_modules/**'));
    assert.ok(globs.includes('**/dist/**'));
  });

  it('esbuildTarget default is es2019', () => {
    const cs = new ConfigService();
    assert.strictEqual(cs.esbuildTarget, 'es2019');
  });
});
