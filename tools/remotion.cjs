// Runs the project's Remotion CLI from the project root, wherever it was called from.
// Optional local settings, in studio.local.json (ignored by git) or environment variables:
//   "tempDir" / VIBE_TEMP_DIR            put Remotion's large temp files on a roomy drive
//   "browserExecutable" / VIBE_BROWSER   use an installed Chrome or Edge instead of downloading one
//                                        (useful where the default download is slow or blocked)
const path = require('node:path'), fs = require('node:fs'), {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
let local = {};
const localFile = path.join(root, 'studio.local.json');
if (fs.existsSync(localFile)) {
  try { local = JSON.parse(fs.readFileSync(localFile, 'utf8')); } catch (e) { console.error(`studio.local.json is not valid JSON: ${e.message}`); process.exit(1); }
}
const temp = process.env.VIBE_TEMP_DIR || local.tempDir;
if (temp) {
  fs.mkdirSync(temp, {recursive: true});
  for (const key of ['TEMP', 'TMP', 'TMPDIR']) process.env[key] = temp;
}
const args = process.argv.slice(2);
const browser = process.env.VIBE_BROWSER || local.browserExecutable;
if (browser && ['render', 'still', 'studio', 'compositions', 'benchmark'].includes(args[0]) && !args.some(a => a.startsWith('--browser-executable'))) {
  if (!fs.existsSync(browser)) { console.error(`browserExecutable not found: ${browser}`); process.exit(1); }
  args.push(`--browser-executable=${browser}`);
}
const cli = path.join(path.dirname(require.resolve('@remotion/cli/package.json', {paths: [root]})), 'remotion-cli.js');
const r = spawnSync(process.execPath, [cli, ...args], {cwd: root, stdio: 'inherit'});
process.exit(r.status ?? 1);
