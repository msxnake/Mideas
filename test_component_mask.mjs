// Test script to verify component mask generation
import fs from 'fs';

// Load the mini_juego60.json project
const projectData = JSON.parse(fs.readFileSync('C:/Users/salam/Downloads/mini_juego60.json', 'utf8'));

console.log('=== PROJECT ANALYSIS ===');
console.log('Entity Templates:', projectData.entityTemplates?.length || 0);
console.log('Sprites:', projectData.sprites?.length || 0);

// Count entities with comp_render
let entitiesWithRender = 0;
const renderTemplates = [];
projectData.entityTemplates?.forEach(template => {
  const hasRender = template.components?.some(c => c.definitionId === 'comp_render' || c.definitionId === 'comp_sprite');
  if (hasRender) {
    entitiesWithRender++;
    renderTemplates.push(template.name);
  }
});

console.log('\n=== RENDER COMPONENT STATS ===');
console.log('Templates with comp_render/comp_sprite:', entitiesWithRender);
console.log('Template names:', renderTemplates.join(', '));

// Check first template with render
const firstRenderTemplate = projectData.entityTemplates?.find(t => 
  t.components?.some(c => c.definitionId === 'comp_render')
);

if (firstRenderTemplate) {
  console.log('\n=== FIRST TEMPLATE WITH RENDER ===');
  console.log('Name:', firstRenderTemplate.name);
  const renderComp = firstRenderTemplate.components.find(c => c.definitionId === 'comp_render');
  console.log('comp_render defaultValues:', renderComp.defaultValues);
}
