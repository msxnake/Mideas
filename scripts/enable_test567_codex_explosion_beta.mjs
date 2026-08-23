import fs from 'node:fs';

const projectPath = process.argv[2] || 'C:/Users/salam/Downloads/test567.json';
const betaBossId = 'msx2boss_test556_defense_core_beta_20260822';
const compactId = 'bitmap_stamp_screen5_area51_codex_explosion_compact_20260822';
const expandedId = 'bitmap_stamp_screen5_area51_codex_explosion_expanded_20260822';

function matchingBracket(text, openIndex) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '[') depth += 1;
    else if (ch === ']' && --depth === 0) return i;
  }
  throw new Error('Unclosed JSON array');
}

const raw = fs.readFileSync(projectPath, 'utf8');
if (!raw.includes(compactId) || !raw.includes(expandedId)) throw new Error('Codex stamps are not installed');
const betaOffset = raw.indexOf(`"id": "${betaBossId}"`);
if (betaOffset < 0) throw new Error(`Boss not found: ${betaBossId}`);
let next = raw;
const deathKey = next.indexOf('"bossDeathExplosionStampIds"', betaOffset);
const open = next.indexOf('[', deathKey);
const close = matchingBracket(next, open);
const indentStart = next.lastIndexOf('\n', deathKey) + 1;
const indent = next.slice(indentStart, deathKey).match(/^\s*/)?.[0] || '      ';
const list = `[\n${indent}  "${compactId}",\n${indent}  "${expandedId}"\n${indent}]`;
next = next.slice(0, open) + list + next.slice(close + 1);
const betaAfter = next.indexOf(`"id": "${betaBossId}"`);
const animatedKey = next.indexOf('"bossDeathExplosionAnimated": false', betaAfter);
if (animatedKey < 0) throw new Error('Beta animation flag not found');
next = next.slice(0, animatedKey) + next.slice(animatedKey).replace(
  '"bossDeathExplosionAnimated": false',
  '"bossDeathExplosionAnimated": true',
);
const backup = `${projectPath}.before_codex_explosion_beta_20260822.bak`;
if (!fs.existsSync(backup)) fs.copyFileSync(projectPath, backup);
const tmp = `${projectPath}.beta_codex_explosion.tmp`;
fs.writeFileSync(tmp, next, 'utf8');
fs.copyFileSync(tmp, projectPath);
fs.unlinkSync(tmp);
console.log(JSON.stringify({ projectPath, betaBossId, installedStampIds: [compactId, expandedId] }, null, 2));
