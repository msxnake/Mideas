import fs from 'fs';
const data = JSON.parse(fs.readFileSync('C:/Users/salam/Downloads/mini_juego60.json', 'utf8'));

const screenmaps = data.assets?.filter(a => a.type === 'screenmap') || [];
const screenData = screenmaps[0]?.data;
const entities = screenData?.layers?.entities || [];

console.log('=== ALL ENTITIES IN SCREENMAP ===\n');

entities.forEach((entity, i) => {
  const template = data.entityTemplates?.find(t => t.id === entity.entityTemplateId);
  const hasRender = template?.components?.some(c => c.definitionId === 'comp_render');

  console.log(`${i + 1}. ${entity.name}`);
  console.log(`   Template: ${template?.name || entity.entityTemplateId}`);
  console.log(`   Has comp_render: ${hasRender ? 'YES ✓' : 'NO ✗'}`);
  console.log(`   Position: (${entity.position?.x}, ${entity.position?.y})`);

  if (hasRender) {
    const renderComp = template.components.find(c => c.definitionId === 'comp_render');
    console.log(`   spriteAssetId: ${renderComp?.defaultValues?.spriteAssetId || 'N/A'}`);
  }
  console.log('');
});

console.log('=== SUMMARY ===');
const withRender = entities.filter(e => {
  const t = data.entityTemplates?.find(tpl => tpl.id === e.entityTemplateId);
  return t?.components?.some(c => c.definitionId === 'comp_render');
});
const withoutRender = entities.filter(e => {
  const t = data.entityTemplates?.find(tpl => tpl.id === e.entityTemplateId);
  return !t?.components?.some(c => c.definitionId === 'comp_render');
});

console.log(`Total: ${entities.length}`);
console.log(`With comp_render: ${withRender.length}`);
console.log(`Without comp_render (anchors): ${withoutRender.length}`);

console.log('\nEntities WITH render:');
withRender.forEach(e => {
  const t = data.entityTemplates?.find(tpl => tpl.id === e.entityTemplateId);
  console.log(`  - ${e.name} (${t?.name})`);
});
