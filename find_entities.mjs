import fs from 'fs';
const data = JSON.parse(fs.readFileSync('C:/Users/salam/Downloads/mini_juego60.json', 'utf8'));

// Search in assets for screenmaps
const screenmaps = data.assets?.filter(a => a.type === 'screenmap') || [];
console.log('Screenmaps found:', screenmaps.length);

screenmaps.forEach((asset, i) => {
  const screenData = asset.data;
  const entities = screenData?.layers?.entities || [];
  console.log('\nScreenmap', i, ':', asset.name);
  console.log('  Entities:', entities.length);
  
  entities.slice(0, 5).forEach(e => {
    const template = data.entityTemplates?.find(t => t.id === e.entityTemplateId);
    const hasRender = template?.components?.some(c => c.definitionId === 'comp_render');
    console.log('    -', e.name, '| template:', template?.name, '| render:', hasRender);
  });
});
