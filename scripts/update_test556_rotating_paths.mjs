import fs from 'node:fs';

const projectPath = process.argv[2] || 'C:/Users/salam/Downloads/test556.json';
const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
const assets = Array.isArray(project.assets) ? project.assets : [];
const find = id => assets.find(asset => asset.id === id);
const now = new Date().toISOString();

const alpha = find('msx2bosspath_test556_defense_core_alpha_20260822');
const beta = find('msx2bosspath_test556_defense_core_beta_20260822');
if (!alpha?.data || !beta?.data) {
  throw new Error('test556 rotating boss paths not found');
}

const actions = frames => [
  { action: 'wait', frames },
  { action: 'fire' },
];

const spline = id => ({ id, mode: 'spline' });

// Coordinates are authored in the same room space as the existing fixture.
// The runtime treats node 1 as the relative origin, so the first points keep
// the current spawn lanes while the remaining nodes describe the orbit.
alpha.data.name = 'Defense Core Alpha - Clockwise Outer Orbit';
alpha.data.nodes = [
  { id: 'test556_alpha_node_1', x: 72, y: 72, actions: actions(24), segment: spline('test556_alpha_seg_1') },
  { id: 'test556_alpha_node_2', x: 120, y: 56, actions: actions(24), segment: spline('test556_alpha_seg_2') },
  { id: 'test556_alpha_node_3', x: 176, y: 72, actions: actions(24), segment: spline('test556_alpha_seg_3') },
  { id: 'test556_alpha_node_4', x: 192, y: 96, actions: actions(24), segment: spline('test556_alpha_seg_4') },
  { id: 'test556_alpha_node_5', x: 176, y: 120, actions: actions(24), segment: spline('test556_alpha_seg_5') },
  { id: 'test556_alpha_node_6', x: 120, y: 136, actions: actions(24), segment: spline('test556_alpha_seg_6') },
  { id: 'test556_alpha_node_7', x: 72, y: 120, actions: actions(24), segment: spline('test556_alpha_seg_7') },
  { id: 'test556_alpha_node_8', x: 56, y: 96, actions: actions(24), segment: spline('test556_alpha_seg_8') },
];
alpha.data.speedPxPerTick = 2;
alpha.data.loopMode = 'loop';
alpha.data.firing = 'path';
alpha.data.notes = 'Smooth clockwise outer orbit around the Defense Core arena. Eight spline corners, 24-frame node cadence, and path-fired laser waves.';
alpha.data.updatedAt = now;

// Beta uses the reverse winding and a longer initial wait: both bosses orbit
// continuously but enter their laser beats out of phase instead of stacking.
beta.data.name = 'Defense Core Beta - Counter-Clockwise Inner Orbit';
beta.data.nodes = [
  { id: 'test556_beta_node_1', x: 128, y: 48, actions: actions(48), segment: spline('test556_beta_seg_1') },
  { id: 'test556_beta_node_2', x: 96, y: 64, actions: actions(48), segment: spline('test556_beta_seg_2') },
  { id: 'test556_beta_node_3', x: 72, y: 96, actions: actions(48), segment: spline('test556_beta_seg_3') },
  { id: 'test556_beta_node_4', x: 96, y: 128, actions: actions(48), segment: spline('test556_beta_seg_4') },
  { id: 'test556_beta_node_5', x: 128, y: 144, actions: actions(48), segment: spline('test556_beta_seg_5') },
  { id: 'test556_beta_node_6', x: 160, y: 128, actions: actions(48), segment: spline('test556_beta_seg_6') },
  { id: 'test556_beta_node_7', x: 184, y: 96, actions: actions(48), segment: spline('test556_beta_seg_7') },
  { id: 'test556_beta_node_8', x: 160, y: 64, actions: actions(48), segment: spline('test556_beta_seg_8') },
];
beta.data.speedPxPerTick = 2;
beta.data.loopMode = 'loop';
beta.data.firing = 'path';
beta.data.notes = 'Smooth counter-clockwise inner orbit, phase-shifted against Alpha so the two laser waves do not stack. Eight spline corners and 48-frame node cadence.';
beta.data.updatedAt = now;

const tempPath = `${projectPath}.rotating-paths.tmp`;
fs.writeFileSync(tempPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
fs.renameSync(tempPath, projectPath);

console.log(JSON.stringify({
  projectPath,
  alpha: { name: alpha.data.name, nodes: alpha.data.nodes.length, winding: 'clockwise', cadence: 24 },
  beta: { name: beta.data.name, nodes: beta.data.nodes.length, winding: 'counter-clockwise', cadence: 48 },
}));
