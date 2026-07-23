import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getConfiguration,
  listComponents,
  listEntities,
  listScreens,
  listWorlds,
  validateControlledAction,
} from '../src/mideas-service.js';

const project = {
  currentProjectName: 'Service demo',
  currentScreenMode: 'SCREEN 2',
  ideConfiguration: { autosaveEnabled: true },
  componentDefinitions: [{ id: 'position', name: 'Position', properties: [{ name: 'x' }] }],
  entityTemplates: [{ id: 'player', name: 'Player', components: [{ definitionId: 'position' }] }],
  assets: [
    { id: 'world-1', name: 'World', type: 'worldmap', data: { nodes: [{ screenAssetId: 'screen-1' }], connections: [] } },
    { id: 'screen-1', name: 'Room', type: 'screenmap', data: { layers: { entities: [{ id: 'entity-1', templateId: 'player', x: 4, y: 8 }] } } },
  ],
};

const bridge = {
  requireProject: () => ({ revision: 7, updatedAt: 'now', project }),
};

test('projects live state into bounded domain lists', () => {
  assert.equal(listWorlds(bridge).worlds[0].screenAssetIds[0], 'screen-1');
  assert.equal(listScreens(bridge).screens[0].entityCount, 1);
  assert.equal(listEntities(bridge).instances[0].templateId, 'player');
  assert.deepEqual(listComponents(bridge).components[0].usedByTemplateIds, ['player']);
  assert.equal(getConfiguration(bridge).ideConfiguration.autosaveEnabled, true);
});

test('validates focus targets before queuing an action', () => {
  assert.deepEqual(
    validateControlledAction(bridge, { type: 'focus_asset', assetId: 'screen-1' }),
    { type: 'focus_asset', assetId: 'screen-1' },
  );
  assert.throws(
    () => validateControlledAction(bridge, { type: 'focus_asset', assetId: 'missing' }),
    /missing asset/,
  );
});
