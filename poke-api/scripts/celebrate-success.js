const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const gifPath = join(__dirname, '..', 'assets', 'test-success.gif');

// This script runs only after the complete suite succeeds; it must never change a passing result to a failure.
if (!existsSync(gifPath)) {
  console.log('All tests passed. Success GIF is unavailable.');
  process.exit(0);
}

const chafa = spawnSync('chafa', ['--size=36x18', '--animate=on', gifPath], { stdio: 'inherit' });

if (chafa.error) {
  console.log('All tests passed. Install Chafa to render the Snorlax celebration: brew install chafa');
}
