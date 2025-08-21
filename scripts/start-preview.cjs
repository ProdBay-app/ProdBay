const { spawn } = require('node:child_process');

const port = process.env.PORT || 4173;

const proc = spawn(
  'node',
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '0.0.0.0', '--port', String(port)],
  { stdio: 'inherit' }
);

proc.on('exit', (code) => {
  process.exit(code ?? 0);
});