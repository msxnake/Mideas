import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectPath = process.argv[2] || 'C:/Users/salam/Downloads/test567.json';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const compactTilePath = path.join(root, 'assets', 'explosion_codex', 'explosion_compact_16x16_tile.json');
const expandedTilePath = path.join(root, 'assets', 'explosion_codex', 'explosion_expanded_16x16_tile.json');

const paletteId = 'palette_screen5_area51_defense_omega_20260818';
const compactId = 'bitmap_stamp_screen5_area51_codex_explosion_compact_20260822';
const expandedId = 'bitmap_stamp_screen5_area51_codex_explosion_expanded_20260822';
const alphaBossId = 'msx2boss_test556_defense_core_alpha_20260822';
const oldIds = ['exp3_1785787255734', 'exp5_1785787396102'];
const palette = [
  { slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' },
  { slotIndex: 1, masterIndex: 0, hex: '#000000' },
  { slotIndex: 2, masterIndex: 10, hex: '#002449' },
  { slotIndex: 3, masterIndex: 19, hex: '#00496D' },
  { slotIndex: 4, masterIndex: 92, hex: '#246D92' },
  { slotIndex: 5, masterIndex: 156, hex: '#496D92' },
  { slotIndex: 6, masterIndex: 73, hex: '#242424' },
  { slotIndex: 7, masterIndex: 146, hex: '#494949' },
  { slotIndex: 8, masterIndex: 219, hex: '#6D6D6D' },
  { slotIndex: 9, masterIndex: 292, hex: '#929292' },
  { slotIndex: 10, masterIndex: 456, hex: '#FF2400' },
  { slotIndex: 11, masterIndex: 435, hex: '#DBDB6D' },
  { slotIndex: 12, masterIndex: 474, hex: '#FF6D49' },
  { slotIndex: 13, masterIndex: 368, hex: '#B6DB00' },
  { slotIndex: 14, masterIndex: 102, hex: '#2492DB' },
  { slotIndex: 15, masterIndex: 511, hex: '#FFFFFF' },
];

function matchingBracket(text, openIndex, open = '[', close = ']') {
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
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error(`No matching ${close} for ${open} at ${openIndex}`);
}

function stampAsset(stampId, name, sourceTile) {
  const now = new Date().toISOString();
  const tile = {
    id: `${stampId}_tile_0`,
    name: `${name} tile 16x16`,
    mode: 'SCREEN5_BITMAP',
    width: 16,
    height: 16,
    sourceType: 'hand-authored-area51-pixelart',
    paletteId,
    pixelData: sourceTile.tile.pixelData,
    tags: ['area51', 'explosion', 'boss-fx', 'screen5', '16x16'],
    createdAt: now,
    updatedAt: now,
    notes: 'Codex contest entry installed in the real test567 project. Exact 16x16 frame.',
  };
  return {
    id: stampId,
    name,
    type: 'msx2bitmapstamp',
    data: {
      id: stampId,
      name,
      savedAt: Date.now(),
      stamp: {
        id: stampId,
        name,
        mode: 'SCREEN5_BITMAP_STAMP',
        columns: 1,
        rows: 1,
        tileWidth: 16,
        tileHeight: 16,
        sourceType: 'hand-authored-area51-pixelart',
        paletteId,
        tiles: [tile],
        tags: ['area51', 'explosion', 'boss-fx', 'screen5', '16x16', 'animation'],
        createdAt: now,
        updatedAt: now,
      },
      palette,
    },
  };
}

function install() {
  if (!fs.existsSync(projectPath)) throw new Error(`Project not found: ${projectPath}`);
  const raw = fs.readFileSync(projectPath, 'utf8');
  if (raw.includes(compactId) || raw.includes(expandedId)) {
    throw new Error('Codex explosion assets are already present; refusing to duplicate them.');
  }
  const compactSource = JSON.parse(fs.readFileSync(compactTilePath, 'utf8'));
  const expandedSource = JSON.parse(fs.readFileSync(expandedTilePath, 'utf8'));
  for (const [label, source] of [['compact', compactSource], ['expanded', expandedSource]]) {
    if (source.tile.width !== 16 || source.tile.height !== 16 || source.tile.pixelData.length !== 256) {
      throw new Error(`${label} source is not exact 16x16/256: ${source.tile.width}x${source.tile.height}/${source.tile.pixelData.length}`);
    }
  }

  const compactAsset = stampAsset(compactId, 'Codex Explosion Compact 16x16', compactSource);
  const expandedAsset = stampAsset(expandedId, 'Codex Explosion Expanded 16x16', expandedSource);
  let next = raw;

  // Replace only Alpha's authored sequence. The project keeps Beta untouched.
  const alphaOffset = next.indexOf(`"id": "${alphaBossId}"`);
  if (alphaOffset < 0) throw new Error(`Boss not found: ${alphaBossId}`);
  const deathKey = next.indexOf('"bossDeathExplosionStampIds"', alphaOffset);
  if (deathKey < 0) throw new Error('Alpha death-explosion list not found');
  const oldOpen = next.indexOf('[', deathKey);
  const oldClose = matchingBracket(next, oldOpen);
  const indentStart = next.lastIndexOf('\n', deathKey) + 1;
  const indent = next.slice(indentStart, deathKey).match(/^\s*/)?.[0] || '      ';
  const newList = `[`
    + `\n${indent}  "${compactId}",`
    + `\n${indent}  "${expandedId}"`
    + `\n${indent}]`;
  next = next.slice(0, oldOpen) + newList + next.slice(oldClose + 1);
  if (!oldIds.every(id => raw.includes(`"${id}"`))) {
    throw new Error(`Expected original Alpha IDs not found: ${oldIds.join(', ')}`);
  }

  // Insert two 1x1 stamps at the physical end of the top-level assets array.
  const assetsKey = next.indexOf('"assets"');
  const assetsOpen = next.indexOf('[', assetsKey);
  const assetsClose = matchingBracket(next, assetsOpen);
  const beforeClose = next.slice(0, assetsClose);
  const trimmed = beforeClose.trimEnd();
  const trailingWhitespace = beforeClose.slice(trimmed.length);
  const indentAsset = (value) => JSON.stringify(value, null, 2)
    .split('\n')
    .map(line => `    ${line}`)
    .join('\n');
  next = trimmed
    + ',\n'
    + indentAsset(compactAsset)
    + ',\n'
    + indentAsset(expandedAsset)
    + trailingWhitespace
    + next.slice(assetsClose);

  const backupPath = `${projectPath}.before_codex_explosion_20260822.bak`;
  if (!fs.existsSync(backupPath)) fs.copyFileSync(projectPath, backupPath);
  const tempPath = `${projectPath}.codex_explosion.tmp`;
  fs.writeFileSync(tempPath, next, 'utf8');
  fs.copyFileSync(tempPath, projectPath);
  fs.unlinkSync(tempPath);
  console.log(JSON.stringify({
    projectPath,
    backupPath,
    alphaBossId,
    installedStampIds: [compactId, expandedId],
    frames: [compactSource.tile.pixelData.length, expandedSource.tile.pixelData.length],
  }, null, 2));
}

install();
