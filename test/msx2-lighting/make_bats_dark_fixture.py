"""Builds the dark-room BAT fixture from the lantern lighting smoke.

The point of the fixture is the art constraint the feature rests on: a sprite
colour in SCREEN 5 mode 2 covers a whole LINE, so "only the eyes are visible"
is only possible when the eye rows carry no other pixel of the body. Rows 6 and
7 of this bat hold nothing but the two white eyes; the head outline is implied
by the rows above and below.

Adds to test/msx2-lighting/lantern.json (both rooms already dark, torch skill
and bullet lantern already on):
  - a 16x16 two-frame `bat_dark` sprite (grey body, white eyes on rows 6-7),
  - three patrolX bats in the DARK room with params.darkEyesColor = 7 (white),
    at three heights so one sits inside the player halo and one well outside.

Usage: python make_bats_dark_fixture.py
Then:
  python ../../scripts/build_mideas_unified_rom.py --json fixture_bats_dark.json \
      --project-root ../.. --asm-output _bats.asm --rom-output _bats.rom \
      --allow-tsc-errors --rom-mode megarom --target-format konami
"""
import copy
import io
import json

SRC, DST = 'lantern.json', 'fixture_bats_dark.json'
SPRITE_ID = 'msx2sprite_bat_dark'
BODY = '#6D6D6D'   # mina palette slot 2
EYES = '#FFFFFF'   # mina palette slot 7 -> params.darkEyesColor
CLEAR = 'rgba(0,0,0,0)'
EYE_COLOR_INDEX = 7

# '#' body, 'o' eye, '.' transparent. Rows 6-7 carry ONLY the eyes: that is the
# whole trick, not a drawing accident.
WINGS_UP = [
    '##............##',
    '.##..........##.',
    '..##........##..',
    '...####..####...',
    '......######....',
    '.....########...',
    '......o....o....',
    '......o....o....',
    '.....########...',
    '......######....',
    '.......####.....',
    '................',
    '................',
    '................',
    '................',
    '................',
]
WINGS_DOWN = [
    '................',
    '................',
    '..##........##..',
    '...##......##...',
    '....########....',
    '.....########...',
    '......o....o....',
    '......o....o....',
    '.....########...',
    '......######....',
    '.......####.....',
    '......##..##....',
    '................',
    '................',
    '................',
    '................',
]


def grid(rows):
    return [[BODY if c == '#' else EYES if c == 'o' else CLEAR for c in row] for row in rows]


def bat(index, tile_x, tile_y, min_x, max_x):
    pixel_x, pixel_y = tile_x * 16, tile_y * 16
    return {
        'id': f'msx2_enemy_bat_dark_{index}',
        'name': f'Bat oscura {index}',
        'kind': 'enemy',
        'position': {'x': tile_x, 'y': tile_y},
        'spriteAssetId': SPRITE_ID,
        'components': {
            'msx2_transform': {
                'tileX': tile_x, 'tileY': tile_y,
                'pixelX': pixel_x, 'pixelY': pixel_y,
                'spawnX': pixel_x, 'spawnY': pixel_y,
            },
            'msx2_movement': {
                'mode': 'patrolX', 'direction': 1, 'speed': 1, 'boundsUnit': 'px',
                'minX': min_x, 'maxX': max_x, 'minY': pixel_y, 'maxY': pixel_y,
            },
            'msx2_hardware_sprite': {
                'msx2SpriteAssetId': SPRITE_ID, 'frame': 0, 'paletteSlot': 10, 'visible': True,
            },
            'msx2_animation': {
                'animation': 'move', 'frameStart': 0, 'frameCount': 2,
                'frameDelay': 8, 'frameList': [0, 1], 'loop': True,
            },
            'msx2_collision': {
                'hitboxW': 16, 'hitboxH': 16, 'offsetX': 0, 'offsetY': 0,
                'solid': False, 'damage': 1,
            },
        },
        'params': {
            'runtime': 'MSX2', 'engine': 'staticEnemy', 'movement': 'patrolX',
            'boundsUnit': 'px', 'minX': min_x, 'maxX': max_x,
            'minY': pixel_y, 'maxY': pixel_y,
            'darkEyesColor': EYE_COLOR_INDEX,
        },
    }


project = json.load(io.open(SRC, encoding='utf-8'))
project['name'] = 'msx2_bats_dark_fixture'
project['assets'] = [a for a in project['assets'] if a.get('id') != SPRITE_ID]

template = next(a for a in project['assets'] if a.get('type') == 'msx2sprite')
sprite = copy.deepcopy(template)
sprite['id'] = SPRITE_ID
sprite['name'] = 'bat_dark'
data = sprite['data']
data['id'] = SPRITE_ID
data['name'] = 'bat_dark'
data['size'] = {'width': 16, 'height': 16}
data['facingDirection'] = 'right'
data['currentFrameIndex'] = 0
data['frames'] = [
    {'id': 'bat_dark_f0', 'data': grid(WINGS_UP)},
    {'id': 'bat_dark_f1', 'data': grid(WINGS_DOWN)},
]
project['assets'].append(sprite)

# Both rooms of the lantern smoke are lamp rooms; the bats go in the BOOT room
# so a probe reaches them without driving a room transition first.
dark = next(a for a in project['assets']
            if a.get('type') == 'msx2bitmaproom' and a['name'] == 'caverna_luz')
entities = [e for e in (dark['data'].get('entities') or [])
            if not str(e.get('id', '')).startswith('msx2_enemy_bat_dark_')]
# Three heights against a halo centred just below the player's middle: the third
# bat flies at player level and crosses it, the first two stay above its reach
# unless a lantern bullet climbs up there.
entities.append(bat(1, 2, 2, 16, 120))
entities.append(bat(2, 7, 5, 48, 180))
entities.append(bat(3, 11, 8, 96, 224))
dark['data']['entities'] = entities

io.open(DST, 'w', encoding='utf-8').write(json.dumps(project, indent=2) + '\n')
print(f'Fixture written: {DST}')
print(f'  sprite : {SPRITE_ID} (2 frames, eyes on rows 6-7 only)')
print(f'  bats   : 3 in caverna_oscura, darkEyesColor={EYE_COLOR_INDEX} ({EYES})')
