/**
 * Test script to verify cleanup of unused componentDefinitions and entityTemplates
 */

import * as fs from 'fs';
import * as path from 'path';
import { cleanUnusedDefinitions } from './utils/projectCleanup';

// Load project
const projectPath = path.join('C:', 'Users', 'salam', 'Downloads', 'ejemplo1(2).json');
const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));

console.log('🔍 Analizando proyecto ejemplo1(2).json...\n');

// Statistics BEFORE cleanup
console.log(`📊 ANTES de limpiar:`);
console.log(`   - ComponentDefinitions: ${projectData.componentDefinitions.length}`);
console.log(`   - EntityTemplates: ${projectData.entityTemplates.length}`);

// Count entities actually used in screenmaps
let totalEntities = 0;
projectData.assets.forEach((asset: any) => {
  if (asset.type === 'screenmap' && asset.data?.entities) {
    totalEntities += asset.data.entities.length;
  }
});
console.log(`   - Entities en ScreenMaps: ${totalEntities}\n`);

// Clean
const { componentDefinitions, entityTemplates, stats } = cleanUnusedDefinitions(projectData);

// Statistics AFTER cleanup
console.log(`✨ DESPUÉS de limpiar:`);
console.log(`   - ComponentDefinitions: ${componentDefinitions.length}`);
console.log(`   - EntityTemplates: ${entityTemplates.length}\n`);

console.log(`🎯 Resultado:`);
console.log(`   - ComponentDefinitions eliminados: ${stats.componentsRemoved}`);
console.log(`   - EntityTemplates eliminados: ${stats.templatesRemoved}\n`);

// Show which templates were kept
if (entityTemplates.length > 0) {
  console.log(`📦 EntityTemplates que se mantienen (están en uso):`);
  entityTemplates.forEach(template => {
    const componentCount = template.components.length;
    console.log(`   - ${template.name} (${componentCount} componentes)`);
  });
  console.log('');
}

// Show which components were kept
if (componentDefinitions.length > 0) {
  console.log(`⚙️  ComponentDefinitions que se mantienen (están en uso):`);
  componentDefinitions.forEach(compDef => {
    console.log(`   - ${compDef.name} (id: ${compDef.id})`);
  });
  console.log('');
}

// Calculate JSON size reduction
const originalSize = JSON.stringify(projectData).length;
const cleanedProject = {
  ...projectData,
  componentDefinitions,
  entityTemplates,
};
const cleanedSize = JSON.stringify(cleanedProject).length;

console.log(`💾 Tamaño del JSON:`);
console.log(`   - Original: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`   - Limpio: ${(cleanedSize / 1024).toFixed(2)} KB`);
console.log(`   - Ahorro: ${(((originalSize - cleanedSize) / originalSize) * 100).toFixed(1)}%`);
