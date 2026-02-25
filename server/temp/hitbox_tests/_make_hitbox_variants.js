const fs = require('fs');
const path = require('path');

const inputPath = 'c:/Users/salam/Downloads/patoantic24(1).json';
const outDir = 'c:/Users/salam/Documents/Programacion/Mideas/server/temp/hitbox_tests';

const profiles = [
  { suffix: 'hb_8x8_center', hitboxWidth: 8, hitboxHeight: 8, offsetX: 4, offsetY: 4 },
  { suffix: 'hb_neg_offset', hitboxWidth: 16, hitboxHeight: 16, offsetX: -3, offsetY: 2 },
  { suffix: 'hb_6x14', hitboxWidth: 6, hitboxHeight: 14, offsetX: 5, offsetY: 1 },
];

function applyHitboxProfile(root, profile) {
  let overrideCount = 0;
  let templateCount = 0;

  function visit(node) {
    if (!node || typeof node !== 'object') return;

    if (
      node.componentOverrides &&
      node.componentOverrides.comp_collision &&
      typeof node.componentOverrides.comp_collision === 'object'
    ) {
      Object.assign(node.componentOverrides.comp_collision, {
        hitboxWidth: profile.hitboxWidth,
        hitboxHeight: profile.hitboxHeight,
        offsetX: profile.offsetX,
        offsetY: profile.offsetY,
      });
      overrideCount++;
    }

    if (Array.isArray(node.components)) {
      for (const comp of node.components) {
        if (!comp || typeof comp !== 'object') continue;
        if (comp.definitionId === 'comp_collision') {
          if (!comp.defaultValues || typeof comp.defaultValues !== 'object') {
            comp.defaultValues = {};
          }
          Object.assign(comp.defaultValues, {
            hitboxWidth: profile.hitboxWidth,
            hitboxHeight: profile.hitboxHeight,
            offsetX: profile.offsetX,
            offsetY: profile.offsetY,
          });
          templateCount++;
        }
      }
    }

    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }

    for (const key of Object.keys(node)) {
      visit(node[key]);
    }
  }

  visit(root);
  return { overrideCount, templateCount };
}

fs.mkdirSync(outDir, { recursive: true });
const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const baseName = path.basename(inputPath, '.json');

for (const profile of profiles) {
  const copy = JSON.parse(JSON.stringify(source));
  const counts = applyHitboxProfile(copy, profile);
  const outPath = path.join(outDir, `${baseName}_${profile.suffix}.json`);
  fs.writeFileSync(outPath, JSON.stringify(copy, null, 2));
  console.log(`${outPath} | overrides=${counts.overrideCount} templates=${counts.templateCount}`);
}
