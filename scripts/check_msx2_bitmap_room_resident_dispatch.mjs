import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatorPath = path.join(
  root,
  'utils',
  'msxGenerator',
  'generators',
  'msx2',
  'msx2Screen5BitmapRoomGenerator.ts',
);
const source = fs.readFileSync(generatorPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`OK: ${message}`);
}

const startMarker = '; __MIDEAS_BITMAP_RESIDENT_DISPATCH_START__';
const endMarker = '; __MIDEAS_BITMAP_RESIDENT_DISPATCH_END__';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker);
const dispatchBlock = start >= 0 && end > start
  ? source.slice(start, end + endMarker.length)
  : '';

assert(start >= 0 && end > start, 'resident room-dispatch block exists');
assert(
  start > source.indexOf('jp .bitmap_main_loop'),
  'dispatch block follows an unconditional main-loop jump',
);
assert(
  end < source.indexOf('${shootRuntime}'),
  'dispatch block is emitted before optional shoot runtime code',
);

const tableExpressions = [
  'roomRenderPtrTableAsm',
  'roomRenderBankTableAsm',
  'roomBlockCountTableAsm',
  'roomCollisionPtrTableAsm',
  'roomCollisionBankTableAsm',
  'roomBehaviorPtrTableAsm',
  'roomBehaviorBankTableAsm',
  'roomTransitionTableAsm',
  'roomSpawnTableAsm',
];

for (const table of tableExpressions) {
  const expression = '${' + table + '}';
  assert(dispatchBlock.includes(expression), `${table} is resident`);
  assert(
    source.split(expression).length === 2,
    `${table} is emitted exactly once`,
  );
}

const loadRoomStart = source.indexOf('load_room:');
const loadRoomEnd = source.indexOf('; FUNCTION:', loadRoomStart + 1);
const loadRoom = source.slice(
  loadRoomStart,
  loadRoomEnd > loadRoomStart ? loadRoomEnd : undefined,
);
const bankSelect = loadRoom.indexOf('call bitmap_room_select_data_bank_a');
const blockCountRead = loadRoom.indexOf('ld hl, bitmap_room_blockcount_table');

assert(loadRoomStart >= 0, 'load_room routine exists');
assert(
  bankSelect >= 0 && blockCountRead > bankSelect,
  'test fixture still covers the P2 remap before the block-count read',
);

if (process.exitCode) {
  process.exit(process.exitCode);
}
