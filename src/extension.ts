import * as vscode from 'vscode';
import { renameInterceptor } from './core/renameInterceptor';
import { logger } from './services/loggerService';

/**
 * Entry point for the Minifyr extension.
 * activate() must only wire up listeners and register commands — no business logic here.
 *
 * @param context - VS Code extension context provided at activation.
 */
export function activate(context: vscode.ExtensionContext): void {
  logger.info('Minifyr activated');

  // Register the core rename listener.
  renameInterceptor.register(context);

  // Register utility command: open the output channel.
  const showChannelCmd = vscode.commands.registerCommand('minifyr.showOutputChannel', () => {
    logger.show();
  });
  context.subscriptions.push(showChannelCmd);

  logger.info('Minifyr ready');
}

/**
 * Called by VS Code when the extension is deactivated (e.g. window closed, extension disabled).
 * Clean up resources to avoid memory leaks.
 */
export function deactivate(): void {
  logger.info('Minifyr deactivated');
  logger.dispose();
}
