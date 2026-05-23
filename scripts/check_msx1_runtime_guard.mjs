#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const read = (...parts) => readFileSync(join(repoRoot, ...parts), 'utf8');

const projectTarget = read('utils', 'projectTarget.ts');
const appUi = read('components', 'AppUI.tsx');
const componentEditor = read('components', 'editors', 'ComponentDefinitionEditor.tsx');
const templateEditor = read('components', 'editors', 'EntityTemplateEditor.tsx');
const asmTemplate = read('utils', 'asmTemplateGenerator.ts');
const defaults = read('data', 'defaults.ts');
const useAppState = read('hooks', 'useAppState.tsx');
const projectHandlers = read('handlers', 'useProjectHandlers.tsx');
const projectCleanup = read('utils', 'projectCleanup.ts');
const msx2Parts = read('components', 'msx2_screen5_editor', 'Msx2Screen5EditorParts.tsx');
const msx2Catalog = read('components', 'msx2_screen5_editor', 'msx2EntityCatalog.ts');
const msx2ScreenEditor = read('components', 'editors', 'Msx2Screen5TileScreenEditor.tsx');

const checks = [
  [
    'omitted component/template target means legacy MSX1',
    projectTarget.includes("const normalizedTarget = target || 'MSX1'") &&
      projectTarget.includes("component.target || 'MSX1'") &&
      projectTarget.includes("template.target || 'MSX1'"),
  ],
  [
    'SCREEN 2 still resolves to MSX1',
    projectTarget.includes("screenMode === 'SCREEN 4 (Graphics II)' || screenMode === 'SCREEN 5 (Graphics III)' ? 'MSX2' : 'MSX1'"),
  ],
  [
    'MSX1 screen editor receives templates through the target filter',
    appUi.includes('entityTemplates.filter(template => isEntityTemplateEnabledForProject(template, currentScreenMode))') &&
      appUi.includes('currentScreenMode={currentScreenMode}'),
  ],
  [
    'MSX1 component editor keeps legacy defaults in SCREEN 2 mode',
    componentEditor.includes('DEFAULT_COMPONENT_DEFINITIONS.filter(definition =>') &&
      componentEditor.includes('isComponentDefinitionEnabledForProject(definition, currentScreenMode)') &&
      componentEditor.includes('target: projectTarget'),
  ],
  [
    'component imports are normalized and filtered to the active target',
    componentEditor.includes('target: definition.target || projectTarget') &&
      componentEditor.includes('isComponentDefinitionEnabledForProject(definition, currentScreenMode)'),
  ],
  [
    'MSX1 template editor keeps legacy defaults in SCREEN 2 mode',
    templateEditor.includes('DEFAULT_ENTITY_TEMPLATES.filter(template =>') &&
      templateEditor.includes('isEntityTemplateEnabledForProject(template, currentScreenMode)') &&
      templateEditor.includes('target: projectTarget'),
  ],
  [
    'template and Player Kit imports are normalized and filtered to the active target',
    templateEditor.includes('target: template.target || projectTarget') &&
      templateEditor.includes('isEntityTemplateEnabledForProject(template, currentScreenMode)') &&
      templateEditor.includes('componentDefinitionsToImport') &&
      templateEditor.includes('templatesToImport') &&
      templateEditor.includes('isComponentDefinitionEnabledForProject(definition, currentScreenMode)'),
  ],
  [
    'initial app state filters defaults by default screen mode',
    useAppState.includes('DEFAULT_PROJECT_COMPONENT_DEFINITIONS') &&
      useAppState.includes('filterComponentDefinitionsForProject(') &&
      useAppState.includes('DEFAULT_PROJECT_ENTITY_TEMPLATES') &&
      useAppState.includes('filterEntityTemplatesForProject(') &&
      useAppState.includes('DEFAULT_SCREEN_MODE'),
  ],
  [
    'new project and project load filter default catalogs by selected screen mode',
    projectHandlers.includes('filterComponentDefinitionsForProject(DEFAULT_COMPONENT_DEFINITIONS, newProjectScreenMode)') &&
      projectHandlers.includes('filterEntityTemplatesForProject(DEFAULT_ENTITY_TEMPLATES, newProjectScreenMode)') &&
      projectHandlers.includes('filterComponentDefinitionsForProject(migratedComponentDefinitions, loadedMode)') &&
      projectHandlers.includes('filterEntityTemplatesForProject(DEFAULT_ENTITY_TEMPLATES, loadedMode)') &&
      projectHandlers.includes('isEntityTemplateEnabledForProject(template, loadedMode)'),
  ],
  [
    'project save cleanup filters opposite-target definitions before serialization',
    projectHandlers.includes('currentScreenMode,') &&
      projectCleanup.includes('currentScreenMode?: string') &&
      projectCleanup.includes('isEntityTemplateEnabledForProject(template, currentScreenMode)') &&
      projectCleanup.includes('isComponentDefinitionEnabledForProject(compDef, currentScreenMode)') &&
      projectCleanup.includes('templatesRemoved: entityTemplates.length - cleanedEntityTemplates.length'),
  ],
  [
    'ASM template generator reinjects missing MSX1 defaults for MSX1 projects',
    asmTemplate.includes("const inferredScreenMode = msx2Screens.length > 0 || msx2Sprites.length > 0 || msx2Bitmaps.length > 0") &&
      asmTemplate.includes(": 'SCREEN 2 (Graphics I)'") &&
      asmTemplate.includes('isEntityTemplateEnabledForProject(template, inferredScreenMode)') &&
      asmTemplate.includes('isComponentDefinitionEnabledForProject(component, inferredScreenMode)'),
  ],
  [
    'legacy default component definitions remain unretargeted while MSX2 defaults are targeted',
    defaults.includes('export const DEFAULT_COMPONENT_DEFINITIONS') &&
      defaults.includes('id: "comp_pos", name: "Position"') &&
      defaults.includes('DEFAULT_MSX2_COMPONENT_DEFINITIONS') &&
      defaults.includes("target: 'MSX2'"),
  ],
  [
    'legacy default entity templates remain unretargeted while MSX2 defaults are targeted',
    defaults.includes('export const DEFAULT_ENTITY_TEMPLATES') &&
      defaults.includes('tpl_player') &&
      defaults.includes('DEFAULT_MSX2_ENTITY_TEMPLATES') &&
      defaults.includes('MSX2_ENTITY_REPERTOIRE.map') &&
      defaults.includes("target: 'MSX2'") &&
      defaults.includes('...DEFAULT_MSX2_ENTITY_TEMPLATES'),
  ],
  [
    'MSX2 native entity repertoire is surfaced only through target-filtered defaults and native editor',
    msx2Parts.includes('MSX2_ENTITY_REPERTOIRE') &&
      msx2Catalog.includes('MSX2_ENTITY_REPERTOIRE') &&
      msx2Catalog.includes("runtime: 'MSX2'") &&
      msx2ScreenEditor.includes('MSX2_ENTITY_REPERTOIRE') &&
      defaults.includes('MSX2_ENTITY_REPERTOIRE') &&
      !componentEditor.includes('MSX2_ENTITY_REPERTOIRE'),
  ],
];

const failures = checks.filter(([, passed]) => !passed);

for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
}

if (failures.length) {
  console.error(`\nMSX1 runtime guard failed: ${failures.length} check(s).`);
  process.exit(1);
}

console.log('\nMSX1 runtime guard passed.');
