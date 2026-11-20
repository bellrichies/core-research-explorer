import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(serverDirectory, '..');
const angularCli = resolve(projectDirectory, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const proxyServer = resolve(serverDirectory, 'core-proxy.mjs');

const server = spawn(process.execPath, ['--env-file-if-exists=.env', proxyServer], {
  cwd: projectDirectory,
  stdio: 'inherit',
});
const client = spawn(
  process.execPath,
  [angularCli, 'serve', '--proxy-config', 'proxy.conf.json', ...process.argv.slice(2)],
  { cwd: projectDirectory, stdio: 'inherit' },
);

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  server.kill();
  client.kill();
  process.exitCode = exitCode;
}

server.on('exit', (code) => stop(code ?? 1));
client.on('exit', (code) => stop(code ?? 1));
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
