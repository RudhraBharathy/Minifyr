const path = require('path');
const fs = require('fs');
const { runTests, downloadAndUnzipVSCode } = require('@vscode/test-electron');

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../');
    const extensionTestsPath = path.resolve(__dirname, '../out/test/integration/index');

    let vscodeExecutablePath = await downloadAndUnzipVSCode('stable');

    // On macOS in VS Code >= 1.110, the binary is named 'Code' rather than 'Electron'.
    // @vscode/test-electron legacy versions expect 'Electron'. Fallback to 'Code' if 'Electron' does not exist.
    if (process.platform === 'darwin' && !fs.existsSync(vscodeExecutablePath)) {
      const codePath = path.resolve(path.dirname(vscodeExecutablePath), 'Code');
      if (fs.existsSync(codePath)) {
        vscodeExecutablePath = codePath;
      }
    }

    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
    });
  } catch (err) {
    console.error('Failed to run tests', err);
    process.exit(1);
  }
}

void main();
