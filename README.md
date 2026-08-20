# Minifyr

> Zero-config file minification for VS Code, triggered by a rename.

Rename any supported file to `*.min.<ext>` in VS Code's Explorer — Minifyr detects it and offers to minify in one click.

## Features

- ⚡ **Trigger on Rename** — Rename `main.js` → `main.min.js` to trigger instant minification.
- 🛡️ **Non-Destructive** — Your original file is automatically preserved alongside the minified output.
- 🌐 **Universal WebAssembly** — Built with `esbuild-wasm` and `lightningcss-wasm` for fast, cross-platform minification with zero external tools or native compilation.
- 🗺️ **Source Maps** — Automatically generates `.map` files alongside output.
- ↩️ **Cancel Safety** — Cancelling the prompt reverts the rename cleanly.

## Supported Languages

| Language / Extensions                                        | Engine                                     |
| ------------------------------------------------------------ | ------------------------------------------ |
| JavaScript / JSX / MJS / CJS (`.js`, `.jsx`, `.mjs`, `.cjs`) | [esbuild](https://esbuild.github.io/)      |
| CSS (`.css`)                                                 | [Lightning CSS](https://lightningcss.dev/) |

## Usage

1. Rename a file in VS Code's Explorer (e.g. `style.css` → `style.min.css`).
2. Choose **Minify** in the prompt.
3. Done! The minified file is created and the original file is preserved.

## Configuration

Customize behavior in VS Code Settings (`minifyr.*`):

| Setting                            | Default                                | Description                                   |
| ---------------------------------- | -------------------------------------- | --------------------------------------------- |
| `minifyr.enabledLanguages`         | `["js", "jsx", "mjs", "cjs", "css"]`   | Active extensions                             |
| `minifyr.alwaysGenerateSourceMaps` | `true`                                 | Emit `.map` source map files                  |
| `minifyr.autoUpdateReferences`     | `false`                                | Offer to update import paths across workspace |
| `minifyr.sizeWarningThresholdKb`   | `500`                                  | Size threshold (KB) before warning prompt     |
| `minifyr.ignoreGlobs`              | `["**/node_modules/**", "**/dist/**"]` | Ignored path patterns                         |
| `minifyr.esbuildTarget`            | `"es2019"`                             | Target ECMAScript version                     |

## Development

```bash
git clone https://github.com/rudhrabharathy/minifyr.git
cd minifyr
npm install
npm run watch
```

Run tests:

```bash
npm run test:unit
```

## License

[MIT](./LICENSE)
