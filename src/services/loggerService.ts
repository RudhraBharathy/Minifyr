import * as vscode from 'vscode';
import { OUTPUT_CHANNEL_NAME } from '../constants';

/** Log severity levels. */
export type LogLevel = 'info' | 'warn' | 'error';

/**
 * Wraps a single VS Code OutputChannel and provides structured, timestamped logging.
 *
 * Usage: import the singleton `logger` instance — do not instantiate LoggerService directly.
 */
export class LoggerService {
  private readonly channel: vscode.OutputChannel;

  constructor() {
    this.channel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  }

  /**
   * Logs an informational message.
   * @param message - Human-readable log message.
   * @param meta - Optional key-value metadata to append.
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.write('INFO', message, meta);
  }

  /**
   * Logs a warning message.
   * @param message - Human-readable log message.
   * @param meta - Optional key-value metadata to append.
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('WARN', message, meta);
  }

  /**
   * Logs an error message. Accepts an Error object or a plain string.
   * @param message - Human-readable log message.
   * @param errorOrMeta - An Error (stack is appended) or key-value metadata.
   */
  error(message: string, errorOrMeta?: Error | Record<string, unknown>): void {
    if (errorOrMeta instanceof Error) {
      this.write('ERROR', message, { stack: errorOrMeta.stack ?? errorOrMeta.message });
    } else {
      this.write('ERROR', message, errorOrMeta);
    }
  }

  /** Makes the Output channel visible. */
  show(): void {
    this.channel.show(true);
  }

  /** Disposes the underlying OutputChannel. */
  dispose(): void {
    this.channel.dispose();
  }

  private write(level: string, message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? `  ${JSON.stringify(meta)}` : '';
    this.channel.appendLine(`[${timestamp}] [${level}] ${message}${metaStr}`);
  }
}

/** Singleton logger instance used throughout the extension. */
export const logger = new LoggerService();
