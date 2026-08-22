import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve(process.argv[2] || 'C:/Users/salam/Downloads/test556.json');
const project = JSON.parse(fs.readFileSync(target, 'utf8'));
const bossId = 'msx2boss_test556_defense_core_alpha_20260822';
const boss = project.assets?.find(asset => asset?.id === bossId && asset?.type === 'msx2boss');
if (!boss?.data) throw new Error(`Boss definition not found: ${bossId}`);

// The bitmap boot path starts this room at player_x=32 and the collision-safe
// body origin is 52. The player body centre is +7px, so authoring 59px makes
// the mandatory intro target exactly 52px and lets the encounter start without
// asking the player to walk into the solid left-room geometry.
boss.data.bossIntroEntryX = 59;
boss.data.notes = `${boss.data.notes || ''} Intro target matches the safe room entry so Path movement and lasers start immediately.`.trim();
boss.data.updatedAt = new Date().toISOString();

const serialized = `${JSON.stringify(project, null, 2)}\n`;
const temp = `${target}.intro.tmp`;
fs.writeFileSync(temp, serialized, 'utf8');
fs.copyFileSync(temp, target);
fs.unlinkSync(temp);
console.log(JSON.stringify({ target, bossId, bossIntroEntryX: boss.data.bossIntroEntryX }, null, 2));
