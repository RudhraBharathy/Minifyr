import * as assert from 'assert';
import { esbuildAdapter } from '../../src/minification/esbuildAdapter';
import { lightningCssAdapter } from '../../src/minification/lightningCssAdapter';

describe('Minification Adapters (WASM)', () => {
  describe('esbuildAdapter', () => {
    it('minifies JavaScript code', async () => {
      const code = 'const hello = "world";\nconsole.log(hello);';
      const result = await esbuildAdapter.minify(code, {
        generateSourceMap: false,
        esbuildTarget: 'es2019',
        filePath: '/workspace/test.js',
      });

      assert.ok(result.code.includes('console.log(hello)'));
      assert.strictEqual(result.map, undefined);
    });

    it('generates source map when requested', async () => {
      const code = 'function add(a, b) { return a + b; }';
      const result = await esbuildAdapter.minify(code, {
        generateSourceMap: true,
        esbuildTarget: 'es2019',
        filePath: '/workspace/test.js',
      });

      assert.ok(result.code.length > 0);
      assert.ok(result.map !== undefined);
      assert.ok(typeof result.map === 'string');
    });

    it('throws meaningful error on invalid JS syntax', async () => {
      await assert.rejects(
        async () => {
          await esbuildAdapter.minify('const = ;', {
            generateSourceMap: false,
            esbuildTarget: 'es2019',
            filePath: '/workspace/invalid.js',
          });
        },
        (err: Error) => {
          return err.message.includes('esbuild error');
        },
      );
    });
  });

  describe('lightningCssAdapter', () => {
    it('minifies CSS content', async () => {
      const css = 'body {\n  color: #ffffff;\n  margin: 0px 0px 0px 0px;\n}';
      const result = await lightningCssAdapter.minify(css, {
        generateSourceMap: false,
        esbuildTarget: 'es2019',
        filePath: '/workspace/style.css',
      });

      assert.ok(result.code.includes('body{color:#fff;margin:0}'));
    });

    it('generates CSS source map when requested', async () => {
      const css = 'h1 { font-size: 24px; }';
      const result = await lightningCssAdapter.minify(css, {
        generateSourceMap: true,
        esbuildTarget: 'es2019',
        filePath: '/workspace/style.css',
      });

      assert.ok(result.code.length > 0);
      assert.ok(result.map !== undefined);
    });

    it('collects engine warnings on invalid at-rules', async () => {
      const result = await lightningCssAdapter.minify('body { @invalid }', {
        generateSourceMap: false,
        esbuildTarget: 'es2019',
        filePath: '/workspace/warning.css',
      });

      assert.ok(result.warnings.length > 0);
      assert.ok(result.warnings.some((w) => w.includes('invalid')));
    });

    it('throws error on invalid CSS syntax', async () => {
      await assert.rejects(
        async () => {
          await lightningCssAdapter.minify('@media ( {', {
            generateSourceMap: false,
            esbuildTarget: 'es2019',
            filePath: '/workspace/invalid.css',
          });
        },
        (err: Error) => {
          return err.message.includes('lightningcss error');
        },
      );
    });
  });
});
