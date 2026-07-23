import assert from 'node:assert/strict';
import test from 'node:test';
import { createLiveBridge } from '../src/live-bridge.js';

const token = 'bridge-test-token-123456';

test('authenticates state sync and delivers controlled actions', async () => {
  const bridge = await createLiveBridge({ token, port: 0 });
  try {
    const unauthorized = await fetch(`${bridge.address}/api/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(unauthorized.status, 401);

    const synced = await fetch(`${bridge.address}/api/state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mideas-MCP-Token': token,
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        clientId: 'test-web',
        project: {
          currentProjectName: 'Demo',
          currentScreenMode: 'SCREEN 2',
          assets: [{ id: 'screen-1', name: 'Room', type: 'screenmap', data: { layers: { entities: [] } } }],
        },
      }),
    });
    assert.equal(synced.status, 200);
    assert.equal(bridge.getSnapshot().project.currentProjectName, 'Demo');

    const queued = bridge.queueAction({ type: 'focus_asset', assetId: 'screen-1' });
    const actionsResponse = await fetch(`${bridge.address}/api/actions`, {
      headers: { 'X-Mideas-MCP-Token': token },
    });
    const actions = await actionsResponse.json();
    assert.equal(actions.actions[0].id, queued.id);
    assert.equal(actions.actions[0].type, 'focus_asset');

    const resultPromise = bridge.waitForAction(queued.id, 1_000);
    const resultResponse = await fetch(`${bridge.address}/api/actions/${queued.id}/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mideas-MCP-Token': token,
      },
      body: JSON.stringify({ ok: true, message: 'focused' }),
    });
    assert.equal(resultResponse.status, 200);
    assert.deepEqual(await resultPromise, { status: 'completed', ok: true, message: 'focused' });
  } finally {
    await bridge.close();
  }
});

test('queues a valid upsert_sprite action and rejects malformed sprites', async () => {
  const bridge = await createLiveBridge({ token, port: 0 });
  try {
    await fetch(`${bridge.address}/api/state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mideas-MCP-Token': token,
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ clientId: 'test-web', project: { assets: [] } }),
    });

    const sprite = {
      id: 'girl_s5',
      name: 'Anime Girl S5',
      target: 'MSX2',
      vdpMode: 'SCREEN5',
      size: { width: 16, height: 16 },
      palette: [{ slotIndex: 0, masterIndex: -1, hex: 'rgba(0,0,0,0)' }],
      backgroundColor: 'rgba(0,0,0,0)',
      frames: [{ id: 'frame_0', data: [['#B66DFF']] }],
      currentFrameIndex: 0,
      hardware: { x: 0, y: 0, color: 15, patternIndex: 0 },
    };
    const queued = bridge.queueAction({ type: 'upsert_sprite', sprite });
    assert.equal(queued.type, 'upsert_sprite');
    assert.equal(queued.payload.sprite.name, 'Anime Girl S5');

    // Wrong target and missing frames must be rejected by the action schema.
    assert.throws(() => bridge.queueAction({ type: 'upsert_sprite', sprite: { ...sprite, target: 'MSX1' } }));
    assert.throws(() => bridge.queueAction({ type: 'upsert_sprite', sprite: { ...sprite, frames: [] } }));
  } finally {
    await bridge.close();
  }
});

test('rejects untrusted origins and invalid actions', async () => {
  const bridge = await createLiveBridge({ token, port: 0 });
  try {
    const response = await fetch(`${bridge.address}/api/state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mideas-MCP-Token': token,
        Origin: 'http://evil.invalid',
      },
      body: JSON.stringify({ clientId: 'bad', project: { assets: [] } }),
    });
    assert.equal(response.status, 403);
    assert.throws(() => bridge.queueAction({ type: 'run_command', command: 'whoami' }));
  } finally {
    await bridge.close();
  }
});
