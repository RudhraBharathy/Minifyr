import * as assert from 'assert';
import * as vscode from 'vscode';

describe('Minifyr Extension Integration Suite', () => {
  it('should find extension in vscode registry', () => {
    const extension = vscode.extensions.getExtension('minifyr.minifyr');
    assert.ok(extension, 'Extension minifyr.minifyr should be found');
  });

  it('should activate extension successfully', async () => {
    const extension = vscode.extensions.getExtension('minifyr.minifyr');
    assert.ok(extension);
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  it('should register minifyr commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('minifyr.showOutputChannel'), 'minifyr.showOutputChannel command should be registered');
  });
});
