import * as assert from 'assert';
import { EngineRegistry } from '../../src/minification/engineRegistry';
import type { Minifier } from '../../src/minification/minifier.interface';
import type { MinifyOptions, MinifyResult } from '../../src/types';

// Minimal stub adapters for testing.
class StubJsAdapter implements Minifier {
  readonly supportedExtensions = ['js', 'mjs'] as const;
  async minify(_content: string, _options: MinifyOptions): Promise<MinifyResult> {
    return { code: 'minified-js', warnings: [] };
  }
}

class StubCssAdapter implements Minifier {
  readonly supportedExtensions = ['css'] as const;
  async minify(_content: string, _options: MinifyOptions): Promise<MinifyResult> {
    return { code: 'minified-css', warnings: [] };
  }
}

describe('EngineRegistry', () => {
  let registry: EngineRegistry;
  const jsAdapter = new StubJsAdapter();
  const cssAdapter = new StubCssAdapter();

  beforeEach(() => {
    registry = new EngineRegistry([jsAdapter, cssAdapter]);
  });

  it('resolves a registered JS extension', () => {
    assert.strictEqual(registry.resolve('js'), jsAdapter);
  });

  it('resolves a registered MJS extension', () => {
    assert.strictEqual(registry.resolve('mjs'), jsAdapter);
  });

  it('resolves a registered CSS extension', () => {
    assert.strictEqual(registry.resolve('css'), cssAdapter);
  });

  it('returns undefined for unregistered extension', () => {
    assert.strictEqual(registry.resolve('html'), undefined);
  });

  it('is case-insensitive for extension lookup', () => {
    assert.strictEqual(registry.resolve('JS'), jsAdapter);
    assert.strictEqual(registry.resolve('CSS'), cssAdapter);
  });

  it('returns all registered extensions', () => {
    const exts = registry.registeredExtensions();
    assert.ok(exts.includes('js'));
    assert.ok(exts.includes('mjs'));
    assert.ok(exts.includes('css'));
  });

  it('later-registered adapter overwrites earlier for same extension', () => {
    class AnotherJsAdapter implements Minifier {
      readonly supportedExtensions = ['js'] as const;
      async minify(_content: string, _options: MinifyOptions): Promise<MinifyResult> {
        return { code: 'another', warnings: [] };
      }
    }
    const another = new AnotherJsAdapter();
    const reg = new EngineRegistry([jsAdapter, another]);
    assert.strictEqual(reg.resolve('js'), another);
  });
});
