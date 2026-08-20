/**
 * Minimal vscode mock for unit tests running outside the Extension Host.
 * Only mocks the APIs used by the modules under test.
 */
export const window = {
  createOutputChannel: (_name: string) => ({
    appendLine: (_line: string) => {},
    show: (_preserveFocus?: boolean) => {},
    dispose: () => {},
  }),
  showInformationMessage: async (..._args: unknown[]) => undefined,
  showWarningMessage: async (..._args: unknown[]) => undefined,
  showErrorMessage: async (..._args: unknown[]) => undefined,
  withProgress: async (_opts: unknown, task: () => Promise<void>) => task(),
};

export const workspace = {
  getConfiguration: (_section: string) => ({
    get: <T>(_key: string, defaultValue: T): T => defaultValue,
  }),
  fs: {},
  textDocuments: [],
  onDidRenameFiles: () => ({ dispose: () => {} }),
  findFiles: async () => [],
};

export const Uri = {
  file: (path: string) => ({ fsPath: path }),
};

export const ProgressLocation = { Notification: 15 };

export const commands = {
  registerCommand: (_id: string, _cb: () => void) => ({ dispose: () => {} }),
};

export const Range = class {
  constructor(
    public start: { line: number; character: number },
    public end: { line: number; character: number },
  ) {}
};

export const WorkspaceEdit = class {
  replace() {}
};
