import * as path from 'path';
import * as fs from 'fs';
import Mocha from 'mocha';

/**
 * Integration test suite runner for @vscode/test-electron.
 */
export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'bdd',
    color: true,
    timeout: 30_000,
  });

  const testsRoot = path.resolve(__dirname, '.');
  const files = getTestFiles(testsRoot);

  files.forEach((f) => mocha.addFile(f));

  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} test(s) failed.`));
      } else {
        resolve();
      }
    });
  });
}

function getTestFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      results.push(fullPath);
    }
  }
  return results;
}
