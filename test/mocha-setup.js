// Setup script for mocha unit tests across all operating systems.
// Configures ts-node and tsconfig-paths to use tsconfig.test.json for path aliases (e.g. vscode mock).
process.env.TS_NODE_PROJECT = 'tsconfig.test.json';
require('ts-node/register');
require('tsconfig-paths/register');
