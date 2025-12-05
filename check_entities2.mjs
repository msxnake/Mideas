import fs from 'fs';

const projectData = JSON.parse(fs.readFileSync('C:/Users/salam/Downloads/mini_juego60.json', 'utf8'));

console.log('=== PROJECT STRUCTURE ===');
console.log('Keys in projectData:', Object.keys(projectData));

// Try different possible locations
if (projectData.screens) {
  console.log('\n"screens" found:', projectData.screens.length);
  projectData.screens.forEach((screen, i) => {
    console.log('Screen', i, ':', Object.keys(screen));
  });
}

if (projectData.gameFlowStates) {
  console.log('\n"gameFlowStates" found:', projectData.gameFlowStates.length);
  projectData.gameFlowStates.forEach((state, i) => {
    console.log('State', i, ':', state.name || state.id);
    if (state.entities) {
      console.log('  Has entities array:', state.entities.length);
      state.entities.slice(0, 3).forEach(e => {
        const template = projectData.entityTemplates?.find(t => t.id === e.entityTemplateId);
        const hasRender = template?.components?.some(c => c.definitionId === 'comp_render');
        console.log('    -', e.name, '(template:', template?.name, ', has render:', hasRender, ')');
      });
    }
  });
}
