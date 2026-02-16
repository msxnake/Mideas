import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/salam/Downloads/mini_juego60.json', 'utf8'));

// Simulate what the generator receives
const screenmaps = data.assets?.filter(a => a.type === 'screenmap') || [];
const screenData = screenmaps[0]?.data;
const entities = screenData?.layers?.entities || [];
const templates = data.entityTemplates || [];
const sprites = data.assets?.filter(a => a.type === 'sprite') || [];

console.log('=== ANALYSIS INPUT ===');
console.log('Entities:', entities.length);
console.log('Templates:', templates.length);
console.log('Sprites:', sprites.length);

console.log('\n=== TESTING getEntitySpriteInfo() LOGIC ===\n');

entities.slice(0, 12).forEach((entity, entityIndex) => {
  console.log(`\n--- Entity ${entityIndex}: ${entity.name} ---`);

  // Step 1: Find template
  const template = templates.find(t => t.id === entity.entityTemplateId);
  if (!template) {
    console.log('  ❌ Template not found:', entity.entityTemplateId);
    console.log('  → Would return null (line 66)');
    return;
  }
  console.log('  ✓ Template found:', template.name);

  // Step 2: Find sprite component
  const spriteComp = template.components?.find(c =>
    c.definitionId === 'comp_sprite' || c.definitionId === 'comp_render'
  );
  if (!spriteComp) {
    console.log('  ❌ No comp_render/comp_sprite in template');
    console.log('  → Would return null (line 72)');
    return;
  }
  console.log('  ✓ Sprite component found:', spriteComp.definitionId);

  // Step 3: Get spriteId
  const defaults = spriteComp.defaultValues || {};
  const overrides = entity.componentOverrides?.['comp_sprite'] || entity.componentOverrides?.['comp_render'] || {};
  const finalProps = { ...defaults, ...overrides };
  const spriteId = finalProps.spriteId || finalProps.spriteAssetId || finalProps.sprite || finalProps.spriteName;

  if (!spriteId) {
    console.log('  ❌ No spriteId in component');
    console.log('  → Would return null (line 79)');
    return;
  }
  console.log('  ✓ SpriteId:', spriteId);

  // Step 4: Find sprite in assets
  const foundIndex = sprites.findIndex(s => s.id === spriteId || s.name === spriteId);

  if (foundIndex < 0) {
    console.log('  ⚠️  Sprite not found in assets');
    console.log('  → Would return PLACEHOLDER (line 86-92)');
    console.log('  → spriteAssetIndex: -1, layerCount: 1, colors: [15]');
  } else {
    console.log('  ✓ Sprite found at index:', foundIndex);
    console.log('  → Would use real sprite');
  }
});
