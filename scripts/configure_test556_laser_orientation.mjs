import fs from 'node:fs';

const projectPath = process.argv[2] || 'C:/Users/salam/Downloads/test556.json';
const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
const assets = project.assets || [];
const find = id => assets.find(asset => asset.id === id);
const now = new Date().toISOString();

const alpha = find('msx2boss_test556_defense_core_alpha_20260822')?.data;
const beta = find('msx2boss_test556_defense_core_beta_20260822')?.data;
if (!alpha || !beta) throw new Error('test556 dual-boss definitions not found');

alpha.bossLaserTileId = 'atlas_area51_omega_laser_horizontal';
alpha.bossLaserDirectionMask = 0x0A; // E + W
alpha.updatedAt = now;
alpha.notes = `${alpha.notes || ''} Uses the seamless horizontal center segment for the east/west arms.`.trim();

beta.bossLaserTileId = 'atlas_area51_omega_laser_vertical';
beta.bossLaserDirectionMask = 0x05; // N + S
beta.updatedAt = now;
beta.notes = `${beta.notes || ''} Uses the seamless vertical center segment for the north/south arms.`.trim();

const tempPath = `${projectPath}.orientation.tmp`;
fs.writeFileSync(tempPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
fs.renameSync(tempPath, projectPath);

console.log(JSON.stringify({
  alpha: { bossLaserTileId: alpha.bossLaserTileId, bossLaserDirectionMask: alpha.bossLaserDirectionMask },
  beta: { bossLaserTileId: beta.bossLaserTileId, bossLaserDirectionMask: beta.bossLaserDirectionMask },
}));
