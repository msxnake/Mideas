// Test script to verify component mask generation
const fs = require('fs');

// Load the mini_juego60.json project
const projectData = JSON.parse(fs.readFileSync('/c/Users/salam/Downloads/mini_juego60.json', 'utf8'));

console.log('=== PROJECT ANALYSIS ===');
console.log('Entity Templates:', projectData.entityTemplates?.length || 0);
console.log('Screen Maps:', projectData.screenMaps?.length || 0);

// Check first entity template
const firstTemplate = projectData.entityTemplates?.[0];
if (firstTemplate) {
  console.log('\n=== FIRST TEMPLATE ===');
  console.log('ID:', firstTemplate.id);
  console.log('Name:', firstTemplate.name);
  console.log('Components:');
  firstTemplate.components?.forEach(comp => {
    console.log(`  - ${comp.definitionId}`);
    if (comp.definitionId === 'comp_render') {
      console.log('    defaultValues:', JSON.stringify(comp.defaultValues, null, 2));
    }
  });
}

// Check first entity instance
const firstScreen = projectData.screenMaps?.[0];
const firstEntity = firstScreen?.layers?.entities?.[0];
if (firstEntity) {
  console.log('\n=== FIRST ENTITY INSTANCE ===');
  console.log('ID:', firstEntity.id);
  console.log('Name:', firstEntity.name);
  console.log('Template ID:', firstEntity.entityTemplateId);
  console.log('Position:', firstEntity.position);
  console.log('Component Overrides:', firstEntity.componentOverrides ? Object.keys(firstEntity.componentOverrides) : 'None');
}

// Count entities with comp_render
let entitiesWithRender = 0;
projectData.entityTemplates?.forEach(template => {
  const hasRender = template.components?.some(c => c.definitionId === 'comp_render' || c.definitionId === 'comp_sprite');
  if (hasRender) {
    entitiesWithRender++;
  }
});

console.log('\n=== RENDER COMPONENT STATS ===');
console.log('Templates with comp_render/comp_sprite:', entitiesWithRender);
