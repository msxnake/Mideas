import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ProjectStore, mergePatch, summarizeProject, validateProject } from '../src/project-store.js';

test('summarizes and validates a minimal project', () => {
  const project = {
    currentProjectName: 'Demo',
    currentScreenMode: 'SCREEN 2',
    assets: [{ id: 'tile-1', name: 'Grass', type: 'tile', data: { width: 8 } }],
  };
  assert.equal(summarizeProject(project).assetsByType.tile, 1);
  assert.deepEqual(validateProject(project), { valid: true, errors: [], warnings: [] });
});

test('finds duplicate ids and a dangling selected asset', () => {
  const project = {
    currentScreenMode: 'SCREEN 2',
    selectedAssetId: 'missing',
    assets: [
      { id: 'same', name: 'A', type: 'tile', data: {} },
      { id: 'same', name: 'B', type: 'tile', data: {} },
    ],
  };
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(issue => issue.code === 'DUPLICATE_ASSET_ID'));
  assert.ok(result.warnings.some(issue => issue.code === 'SELECTED_ASSET_NOT_FOUND'));
});

test('applies JSON Merge Patch semantics', () => {
  assert.deepEqual(
    mergePatch({ name: 'A', data: { x: 1, y: 2 }, tags: [1] }, { data: { x: 3, y: null }, tags: [2] }),
    { name: 'A', data: { x: 3 }, tags: [2] },
  );
});

test('writes atomically and creates a backup', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'mideas-mcp-'));
  try {
    const projectPath = path.join(directory, 'demo.json');
    const original = { currentScreenMode: 'SCREEN 2', assets: [] };
    await writeFile(projectPath, JSON.stringify(original), 'utf8');
    const store = new ProjectStore([directory]);
    await store.initialize();
    const loaded = await store.readProject(projectPath);
    const changed = { ...loaded.project, currentProjectName: 'Changed' };
    const result = await store.writeProject(projectPath, changed, { expectedMtimeMs: loaded.mtimeMs });
    assert.equal(JSON.parse(await readFile(projectPath, 'utf8')).currentProjectName, 'Changed');
    assert.deepEqual(JSON.parse(await readFile(result.backupPath, 'utf8')), original);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
