// Script de verificación - ejecutar en consola del navegador
// o desde Node.js para verificar que los componentes están cargados

// Verificar si defaults.ts exporta los componentes correctos
import { DEFAULT_COMPONENT_DEFINITIONS, DEFAULT_ENTITY_TEMPLATES } from './data/defaults.ts';

console.log('🔍 Verificando componentes...');

// Buscar comp_pacMovement
const pacMovementComp = DEFAULT_COMPONENT_DEFINITIONS.find(c => c.id === 'comp_pacMovement');
if (pacMovementComp) {
    console.log('✅ comp_pacMovement encontrado:', pacMovementComp);
    console.log('   Propiedades:', pacMovementComp.properties.map(p => p.name));
} else {
    console.log('❌ comp_pacMovement NO encontrado');
}

// Buscar tpl_pacman_player
const pacmanTemplate = DEFAULT_ENTITY_TEMPLATES.find(t => t.id === 'tpl_pacman_player');
if (pacmanTemplate) {
    console.log('✅ tpl_pacman_player encontrado:', pacmanTemplate.name);
    console.log('   Componentes:', pacmanTemplate.components.map(c => c.definitionId));
} else {
    console.log('❌ tpl_pacman_player NO encontrado');
}

console.log('🏁 Verificación completada');