import fs from 'fs';

const projectData = JSON.parse(fs.readFileSync('C:/Users/salam/Downloads/mini_juego60.json', 'utf8'));

console.log('=== ENTITY INSTANCES IN SCREENMAPS ===');

// Check all screen maps and their entity layers
projectData.screenMaps?.forEach((screen, screenIndex) => {
  const entities = screen.layers?.entities || [];
  console.log(`\nScreen ${screenIndex}: "${screen.name}" - ${entities.length} entities`);

  entities.forEach((entity, entityIndex) => {
    const template = projectData.entityTemplates?.find(t => t.id === entity.entityTemplateId);
    const hasRender = template?.components?.some(c => c.definitionId === 'comp_render' || c.definitionId === 'comp_sprite');

    console.log(`  ${entityIndex}. ${entity.name || entity.id}`);
    console.log(`      Template: ${template?.name || entity.entityTemplateId}`);
    console.log(`      Has comp_render: ${hasRender ? 'YES' : 'NO'}`);
    console.log(`      Position: (${entity.position?.x}, ${entity.position?.y})`);
  });
});

// Summary
let totalEntities = 0;
let entitiesWithRender = 0;
let entitiesWithoutRender = 0;

projectData.screenMaps?.forEach(screen => {
  screen.layers?.entities?.forEach(entity => {
    totalEntities++;
    const template = projectData.entityTemplates?.find(t => t.id === entity.entityTemplateId);
    const hasRender = template?.components?.some(c => c.definitionId === 'comp_render' || c.definitionId === 'comp_sprite');

    if (hasRender) {
      entitiesWithRender++;
    } else {
      entitiesWithoutRender++;
    }
  });
});

console.log('\n=== SUMMARY ===');
console.log(`Total entity instances: ${totalEntities}`);
console.log(`With comp_render: ${entitiesWithRender}`);
console.log(`Without comp_render (anchors/nucleos): ${entitiesWithoutRender}`);
