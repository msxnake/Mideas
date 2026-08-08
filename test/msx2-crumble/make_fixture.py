"""Builds the crumbling-floor (Manic Miner) smoke fixture.

Usage:
  python ../../scripts/build_msx2_screen5_bitmap_room_smoke.py --skip-openmsx \
      --json-output smoke_base.json --asm-output smoke_base.asm --rom-output smoke_base.rom
  python make_fixture.py [fixture_on.json] [frames_per_stage]

Starts from the canonical SCREEN 5 bitmap-room smoke project (its rooms have an
empty collision grid) and authors a thick floor in room A: rows 6..11 solid. The
player spawns at (48, 80) = column 3 and rests ON row 6 (feet at y=96).

Why a thick floor and not a single platform row: this project's player falls fast
enough to tunnel through a one-cell-thick platform, so it would never come to rest
on the cell under test. Six solid rows make the ground unambiguous.

Row 6 columns 2..4 carry the per-cell CRUMBLING bit 0x04 and get a Brick Red tile
drawn on them, so the erosion is visible. The player collapses the cell it is
standing on by doing nothing at all and then drops exactly one cell onto row 7:

    player_y 80 (standing on row 6)  ->  player_y 96 (standing on row 7)
    collision cell (3,6) at #C073: #10 solid -> 0

Columns 2 and 4 are only reached by walking, so they are controls that must still
read #10 at the end of the run.

  python ../../scripts/build_mideas_unified_rom.py --json fixture_on.json \
      --project-root ../.. --asm-output on.asm --rom-output on.rom --allow-tsc-errors
  openmsx -machine C-BIOS_MSX2 -cart on.rom -script crumble_probe.tcl
"""
import json, io, sys

CRUMBLING_BIT = 0x04
SOLID_BIT = 0x10
FLOOR_ROWS = range(6, 12)     # thick ground; row 6 is the walkable surface
SURFACE_ROW = 6
CRUMBLE_COLS = (2, 3, 4)
FLOOR_TILE_INDEX = 1          # atlas entry 1 = "Brick Red"

dst = sys.argv[1] if len(sys.argv) > 1 else 'fixture_on.json'
frames = int(sys.argv[2]) if len(sys.argv) > 2 else 20

d = json.load(io.open('smoke_base.json', encoding='utf-8'))
room = next(a for a in d['assets'] if a.get('type') == 'msx2bitmaproom')
data = room['data']
entries = data['atlas']['entries']
floor_entry = entries[FLOOR_TILE_INDEX - 1]
floor_entry['crumbling'] = True
floor_entry['crumbleFramesPerStage'] = frames

for row in FLOOR_ROWS:
    for col in range(16):
        data['collision'][row][col] = SOLID_BIT
for col in CRUMBLE_COLS:
    data['collision'][SURFACE_ROW][col] |= CRUMBLING_BIT
    # A cell's erosion speed comes from the atlas tile painted on it, so the tile
    # grid has to reference the entry carrying crumbleFramesPerStage.
    data['tileGrid'][SURFACE_ROW][col] = FLOOR_TILE_INDEX
    # This room's composition is 'authored', so tiles are not drawn from the grid:
    # add the copy command explicitly to watch the erosion eat it.
    data['composition']['commands'].append({
        'id': f'crumble_tile_{col}',
        'op': 'copy',
        'atlasEntryId': floor_entry['id'],
        'dx': col * 16,
        'dy': SURFACE_ROW * 16,
    })

json.dump(d, io.open(dst, 'w', encoding='utf-8'))
print(f'{dst}: room "{room.get("name")}" rows {FLOOR_ROWS.start}..{FLOOR_ROWS.stop - 1} solid')
for col in CRUMBLE_COLS:
    cell = SURFACE_ROW * 16 + col
    print(f'  crumbling col {col}: cell {cell}, RAM {hex(0xC010 + cell)},'
          f' collision {data["collision"][SURFACE_ROW][col]:#04x}')
print(f'  {frames} frames per 2px stage -> {frames * 8} frames per tile')
