// Contract test for the SubMenu link repair (utils/msx2GameFlowSubMenuLinks.ts).
// Run: npx tsx scripts/test_msx2_gameflow_submenu_links.ts
import assert from 'node:assert/strict';
import { firstFreeSubMenuOption, repairSubMenuConnections } from '../utils/msx2GameFlowSubMenuLinks';

const menu: any = { id: 'menu', type: 'SubMenu', position: { x: 0, y: 0 }, title: 'Main', options: [{ id: 'start', text: 'START' }, { id: 'opts', text: 'OPTIONS' }] };
const nodes: any[] = [menu, { id: 'w', type: 'WorldLink' }, { id: 't', type: 'Text' }];
const link = (from: string, to: string, sourceId?: string) => ({ id: `${from}-${to}-${sourceId ?? 'x'}`, from: { nodeId: from, sourceId }, to: { nodeId: to } }) as any;

// the graph of the report: OPTIONS is wired, the START link has no option ("default")
const broken = [link('menu', 'w'), link('menu', 't', 'opts')];
const fixed = repairSubMenuConnections(nodes, broken);
assert.equal(fixed.repaired, 1);
assert.equal(fixed.connections.find(c => c.to.nodeId === 'w')!.from.sourceId, 'start', 'the loose link goes to START, the first free option');
assert.equal(fixed.connections.find(c => c.to.nodeId === 't')!.from.sourceId, 'opts', 'wired options are left alone');
assert.equal(broken[0].from.sourceId, undefined, 'the input is not mutated');

// nothing to repair: same array back
const healthy = [link('menu', 'w', 'start'), link('menu', 't', 'opts')];
assert.equal(repairSubMenuConnections(nodes, healthy).connections, healthy);
assert.equal(repairSubMenuConnections(nodes, healthy).repaired, 0);

// a link to an option that was deleted counts as loose too
const stale = [link('menu', 'w', 'gone'), link('menu', 't', 'opts')];
assert.equal(repairSubMenuConnections(nodes, stale).connections[0].from.sourceId, 'start');

// more loose links than free options: the extra one is left for the validator to report
const tooMany = [link('menu', 'w'), link('menu', 't'), link('menu', 'w', undefined)];
const many = repairSubMenuConnections(nodes, tooMany);
assert.equal(many.repaired, 2);
assert.equal(many.connections.filter(c => !c.from.sourceId).length, 1);

// links of other nodes are never touched
const other = [link('w', 't'), link('menu', 'w')];
const kept = repairSubMenuConnections(nodes, other);
assert.equal(kept.connections[0], other[0]);

// where a new link should go
assert.equal(firstFreeSubMenuOption(menu, []), 'start');
assert.equal(firstFreeSubMenuOption(menu, [link('menu', 'w', 'start')]), 'opts');
assert.equal(firstFreeSubMenuOption(menu, [link('menu', 'w', 'start'), link('menu', 't', 'opts')]), undefined);

console.log('msx2 gameflow submenu links: OK');
