/**
 * Test script to verify entityTemplates cleanup functionality
 * This simulates the cleanup that happens when loading a project
 */

import * as fs from 'fs';
import * as path from 'path';

interface ComponentProperty {
  name: string;
  type: string;
  defaultValue: any;
  description?: string;
}

interface ComponentDefinition {
  id: string;
  name: string;
  description: string;
  properties: ComponentProperty[];
}

interface EntityTemplateComponent {
  definitionId: string;
  defaultValues: Record<string, any>;
}

interface EntityTemplate {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  components: EntityTemplateComponent[];
}

interface ProjectData {
  componentDefinitions: ComponentDefinition[];
  entityTemplates: EntityTemplate[];
}

// Función de limpieza (copia de useProjectHandlers.tsx)
function cleanEntityTemplates(
  entityTemplates: EntityTemplate[],
  componentDefinitions: ComponentDefinition[]
): EntityTemplate[] {
  return entityTemplates.map((template: EntityTemplate) => {
    const cleanedComponents = template.components.map(comp => {
      const componentDef = componentDefinitions.find((cd: ComponentDefinition) => cd.id === comp.definitionId);
      if (!componentDef) return comp; // Si no hay definición, mantener como está

      // Crear nuevos defaultValues solo con valores diferentes del default
      const cleanedDefaultValues: Record<string, any> = {};
      Object.entries(comp.defaultValues || {}).forEach(([key, value]) => {
        const propertyDef = componentDef.properties.find(p => p.name === key);
        const definitionDefault = propertyDef?.defaultValue;

        // Normalizar para comparación (manejar diferencias de tipo string/number/boolean)
        const normalizedValue = String(value);
        const normalizedDefault = String(definitionDefault);

        // Solo mantener si es diferente del default de la definición
        if (normalizedValue !== normalizedDefault) {
          cleanedDefaultValues[key] = value;
        }
      });

      return { ...comp, defaultValues: cleanedDefaultValues };
    });

    return { ...template, components: cleanedComponents };
  });
}

// Cargar proyecto
const projectPath = path.join('C:', 'Users', 'salam', 'Downloads', 'ejemplo1(1).json');
const projectData: ProjectData = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));

console.log('🔍 Analizando proyecto...\n');

// Estadísticas ANTES de limpiar
let totalPropertiesBefore = 0;
let totalPropertiesAfter = 0;

projectData.entityTemplates.forEach(template => {
  template.components.forEach(comp => {
    totalPropertiesBefore += Object.keys(comp.defaultValues || {}).length;
  });
});

console.log(`📊 ANTES de limpiar:`);
console.log(`   - Entity Templates: ${projectData.entityTemplates.length}`);
console.log(`   - Propiedades totales en defaultValues: ${totalPropertiesBefore}\n`);

// Limpiar
const cleanedTemplates = cleanEntityTemplates(
  projectData.entityTemplates,
  projectData.componentDefinitions
);

// Estadísticas DESPUÉS de limpiar
cleanedTemplates.forEach(template => {
  template.components.forEach(comp => {
    totalPropertiesAfter += Object.keys(comp.defaultValues || {}).length;
  });
});

console.log(`✨ DESPUÉS de limpiar:`);
console.log(`   - Entity Templates: ${cleanedTemplates.length}`);
console.log(`   - Propiedades totales en defaultValues: ${totalPropertiesAfter}\n`);

console.log(`🎯 Resultado:`);
console.log(`   - Propiedades redundantes eliminadas: ${totalPropertiesBefore - totalPropertiesAfter}`);
console.log(`   - Reducción: ${((1 - totalPropertiesAfter / totalPropertiesBefore) * 100).toFixed(1)}%\n`);

// Mostrar ejemplo de un template limpiado
const pacmanTemplate = cleanedTemplates.find(t => t.name.toLowerCase().includes('pacman'));
if (pacmanTemplate) {
  console.log(`📦 Ejemplo - Template "${pacmanTemplate.name}":\n`);

  pacmanTemplate.components.forEach(comp => {
    const compDef = projectData.componentDefinitions.find(cd => cd.id === comp.definitionId);
    console.log(`   Componente: ${compDef?.name || comp.definitionId}`);

    const overrideCount = Object.keys(comp.defaultValues).length;
    const totalPropsCount = compDef?.properties.length || 0;

    if (overrideCount === 0) {
      console.log(`      ✅ defaultValues: {} (todos usan defaults de definición)`);
    } else {
      console.log(`      ⚙️  defaultValues guardados: ${overrideCount}/${totalPropsCount} propiedades`);
      Object.entries(comp.defaultValues).forEach(([key, value]) => {
        console.log(`         - ${key}: ${JSON.stringify(value)}`);
      });
    }
    console.log('');
  });
}

// Calcular tamaño del JSON
const originalSize = JSON.stringify(projectData).length;
const cleanedProjectData = { ...projectData, entityTemplates: cleanedTemplates };
const cleanedSize = JSON.stringify(cleanedProjectData).length;

console.log(`💾 Tamaño del JSON:`);
console.log(`   - Original: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`   - Limpio: ${(cleanedSize / 1024).toFixed(2)} KB`);
console.log(`   - Ahorro: ${(((originalSize - cleanedSize) / originalSize) * 100).toFixed(1)}%`);
