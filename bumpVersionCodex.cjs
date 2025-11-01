#!/usr/bin/env node
const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const ROOT = process.cwd();

const args = process.argv.slice(2);
const targetVersionArg = args.find(a => /^\d+(?:\.\d+)?$/.test(a));
const withPackage = args.includes('--package');
const withCommit = args.includes('--commit');
const withPush = args.includes('--push');

const files = {
  readme: path.join(ROOT, 'README.md'),
  constants: path.join(ROOT, 'constants.ts'),
  versionDoc: path.join(ROOT, 'docs', 'project', 'VERSION_LOCATIONS.md'),
  packageJson: path.join(ROOT, 'package.json'),
};

function readFile(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function writeFile(p, content) {
  fs.writeFileSync(p, content, 'utf8');
}

function getCurrentVersionFromConstants() {
  const txt = readFile(files.constants);
  if (!txt) throw new Error('constants.ts not found');
  const m = txt.match(/APP_VERSION\s*=\s*"(\d+(?:\.\d+)?)"/);
  if (!m) throw new Error('APP_VERSION not found in constants.ts');
  return m[1];
}

function incVersion(v) {
  const num = parseFloat(v);
  const next = (num + 0.001).toFixed(3);
  // trim trailing zeros to keep style (e.g., 0.260 → 0.26 if needed); project prefers 3 decimals, keep them
  return next;
}

function updateConstants(version) {
  let txt = readFile(files.constants);
  txt = txt.replace(/(APP_VERSION\s*=\s*")(\d+(?:\.\d+)?)(")/, `$1${version}$3`);
  writeFile(files.constants, txt);
}

function updateReadme(version) {
  const txt = readFile(files.readme);
  if (!txt) return;
  const out = txt.replace(/\*\*Version\s+\d+(?:\.\d+)?\*\*/, `**Version ${version}**`);
  writeFile(files.readme, out);
}

function updateVersionDoc(version) {
  const txt = readFile(files.versionDoc);
  if (!txt) return;
  const out = txt.replace(/(##\s+Current Version:\s*)(\d+(?:\.\d+)?)/, `$1${version}`);
  writeFile(files.versionDoc, out);
}

function updatePackageJson(version) {
  if (!fs.existsSync(files.packageJson)) return;
  const pkg = JSON.parse(fs.readFileSync(files.packageJson, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(files.packageJson, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

function git(cmd) {
  return cp.execSync(cmd, { stdio: 'inherit' });
}

function main() {
  const current = getCurrentVersionFromConstants();
  const next = targetVersionArg || incVersion(current);

  updateConstants(next);
  updateReadme(next);
  updateVersionDoc(next);
  if (withPackage) updatePackageJson(next);

  console.log(`\nUpdated version to ${next}`);
  console.log(` - constants.ts`);
  if (fs.existsSync(files.readme)) console.log(` - README.md`);
  if (fs.existsSync(files.versionDoc)) console.log(` - docs/project/VERSION_LOCATIONS.md`);
  if (withPackage && fs.existsSync(files.packageJson)) console.log(` - package.json`);

  if (withCommit) {
    try {
      git('git add README.md constants.ts docs/project/VERSION_LOCATIONS.md package.json 2>$null');
      git(`git commit -m "Version ${next} - bump via Codex"`);
      if (withPush) {
        git('git push');
      }
    } catch (e) {
      console.error('Git operation failed:', e.message);
      process.exitCode = 1;
    }
  }
}

main();

