#!/usr/bin/env node
/**
 * Contract checks for the SCREEN 5 bitmap boss death presentation.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
// core.autocrlf checks these files out with CRLF, while the multi-line literals
// below are written with \n. Without normalising, those checks go red on a
// clean tree and the contract silently stops guarding anything.
const read = (...parts) => readFileSync(join(root, ...parts), 'utf8').replace(/\r\n/g, '\n');

const types = read('types.ts');
const editor = read('components', 'editors', 'Msx2BossEditor.tsx');
const catalog = read('components', 'msx2_screen4_editor', 'msx2EntityCatalog.ts');
const bossGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapBossGenerator.ts');
const roomGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts');

const checks = [
  ['Definition stores stamp list and timing controls',
    types.includes('bossDeathExplosionStampIds?: string[]') &&
    types.includes('bossDeathExplosionCount?: number') &&
    types.includes('bossDeathExplosionInterval?: number') &&
    types.includes('bossDeathExplosionHoldFrames?: number')],
  ['New bosses and placed encounters receive safe defaults',
    catalog.includes('bossDeathExplosionStampIds: []') &&
    catalog.includes('bossDeathExplosionCount: 8') &&
    catalog.includes('bossDeathExplosionInterval: 6') &&
    catalog.includes('bossDeathExplosionHoldFrames: 12')],
  ['Boss editor exposes the Death FX section and multiple bitmap-stamp picker',
    editor.includes("'Death FX'") &&
    editor.includes('Boss Death — Bitmap Explosions') &&
    editor.includes('selectedIds.includes(stamp.id)')],
  ['UI documents transparent colour and delayed defeat actions',
    editor.includes('Colour 0 is') &&
    editor.includes('Defeat actions') &&
    editor.includes('barrier removal run only after')],
  // Since FASE 4 the two parts go to different places: the body is split into
  // 16x16 cells that live in the TRANSIENT WINDOW, uploaded per room, while the
  // explosion frames stay in the shared atlas as whole rectangles -- they are
  // drawn with LMMM + TIMP on the frame the boss dies, when nothing can be
  // uploaded behind a transition.
  ['Explosion stamps stay in the shared atlas, bodies go to the boss window',
    roomGen.includes('function collectBossBitmapStamps') &&
    roomGen.includes('params.bossDeathExplosionStampIds') &&
    roomGen.includes('const bossStampCollection = collectBossBitmapStamps') &&
    roomGen.includes('bossStampCollection.items.filter(item => !bossStampCollection.bodyGrids.has') &&
    roomGen.includes('bitmap_boss_window_load')],
  ['Generator emits a compact per-room death-FX table',
    bossGen.includes('deathFxTables: number[][]') &&
    bossGen.includes('function buildDeathFxTable') &&
    bossGen.includes('bitmap_boss_death_fx_ptr_table')],
  ['Death state freezes normal boss logic and rejects further bullet hits',
    bossGen.includes('boss_active     EQU ${asmWord(ram + 0)}   ; 0 none, 1 alive, 2 death FX') &&
    /cp 2\s+[\s\S]{0,60}?jp z, bitmap_boss_death_update/.test(bossGen) &&
    /bitmap_boss_bullet_hit:[\s\S]{0,80}?cp 1[\s\S]{0,80}?ret nz/.test(bossGen)],
  ['Explosion drawing uses LMMM/TIMP so colour 0 remains transparent',
    bossGen.includes('bitmap_boss_death_draw:') &&
    bossGen.includes('ld a, #98') &&
    bossGen.includes('LMMM + TIMP')],
  ['Progress actions and room unlock happen only at finalization',
    bossGen.includes('bitmap_boss_finalize_death:') &&
    bossGen.indexOf('bitmap_boss_finalize_death:') <
      bossGen.indexOf('call bitmap_boss_run_defeat_actions')],
  ['Sprite and bitmap boss projectiles are retired before death FX',
    bossGen.includes('call bitmap_boss_sbul_sat') &&
    bossGen.includes('.kill_bitmap_projectile_done') &&
    bossGen.includes('call bitmap_boss_proj_restore')],
  ['Death-FX RAM is opt-in and chained after intro RAM',
    bossGen.includes('const hasDeathFx =') &&
    bossGen.includes('const deathRamBase = introRamBase +') &&
    bossGen.includes('(hasDeathFx ? DEATH_RAM_BYTES : 0)')],

  // --- MSX2 PSG explosion sound ---
  ['Definition, defaults and editor expose the optional boss explosion sound',
    types.includes('bossDeathExplosionSoundAssetId?: string') &&
    catalog.includes("bossDeathExplosionSoundAssetId: ''") &&
    editor.includes('Explosion sound (MSX2 PSG)') &&
    editor.includes('— Built-in MSX2 explosion —') &&
    editor.includes("set('bossDeathExplosionSoundAssetId'")],
  ['SCREEN 5 passes normalized Sound FX assets into the boss compiler',
    roomGen.includes('const bossDeathSounds = new Map<string, PSGSoundData>()') &&
    roomGen.includes('bossDeathSounds,')],
  ['Custom sounds are compiled to channel C without touching the global AY envelope',
    bossGen.includes('function compileBossDeathSound') &&
    bossGen.includes('duration, R4, R5, R6, R10, R7-C-bits') &&
    bossGen.includes('Hardware envelopes are deliberately flattened') &&
    bossGen.includes('and #DB') &&
    bossGen.includes('psg_sfx_r7_c_bits')],
  ['Missing or empty custom sounds fall back to the built-in MSX2 explosion',
    bossGen.includes('using the built-in PSG explosion') &&
    bossGen.includes('bitmap_boss_death_sfx_default_pairs:') &&
    bossGen.includes('db 6,#08,10,#10,11,#80,12,#00,13,#09,7,#1F')],
  // One blast = one sound. The legacy random-variant mode spends one cadence
  // step per blast, so it still fires on every step. A compact animated blast
  // spends one step per FRAME, so only the step that opens the cycle (selector
  // = slots-1) may start the sound, or a 3-frame blast retriggers it 3 times.
  ['Every visible blast triggers the selected/default sound exactly once',
    bossGen.includes("call bitmap_boss_death_sfx_start   ; one cadence step = one blast in this mode\n` : ''}    jp bitmap_boss_death_draw") &&
    bossGen.includes("call bitmap_boss_death_sfx_start\n` : ''}    call bitmap_boss_death_anim_draw") &&
    /ld a, b\n    dec a\n    cp c\n    call z, bitmap_boss_death_sfx_start/.test(bossGen)],

  // --- animated explosions (compact by default, concurrent opt-in) ---
  ['Definition stores the animated mode and its frame delay',
    types.includes('bossDeathExplosionAnimated?: boolean') &&
    types.includes('bossDeathExplosionConcurrent?: boolean') &&
    types.includes('bossDeathExplosionFrameDelay?: number') &&
    catalog.includes('bossDeathExplosionAnimated: false') &&
    catalog.includes('bossDeathExplosionConcurrent: false') &&
    catalog.includes('bossDeathExplosionFrameDelay: 4')],
  ['Boss editor offers the animated toggle, the frame delay and an ordered picker',
    editor.includes('Animated explosion (2-3 frames)') &&
    editor.includes("set('bossDeathExplosionAnimated'") &&
    editor.includes("set('bossDeathExplosionFrameDelay'") &&
    editor.includes("set('bossDeathExplosionConcurrent'") &&
    editor.includes('MAX_DEATH_ANIM_FRAMES = 3') &&
    editor.includes('click in order')],
  ['Ordered compact animation is default and concurrent slots are explicit',
    bossGen.includes('const compactAnimated = frameSequence && !animated') &&
    bossGen.includes('params?.bossDeathExplosionConcurrent === true') &&
    bossGen.includes('0x80 | compactCycleSlots') &&
    bossGen.includes('bit 7, a')],
  ['Compact animation rebuilds the complete Boss after every frame sequence',
    bossGen.includes('selector 0 as an implicit opaque body rebuild') &&
    bossGen.includes('.death_compact_frame:') &&
    /or a[\s\S]{0,80}?jr nz, \.death_compact_frame[\s\S]{0,420}?call bitmap_boss_table_ix[\s\S]{0,80}?jp bitmap_boss_draw/.test(bossGen)],
  ['Live Boss room lookup remains independent from projectile/death helpers',
    bossGen.includes('bitmap_boss_table_ix:\n    ; Keep the live-body lookup self-contained.') &&
    bossGen.includes('ld hl, bitmap_boss_ptr_table\n    add hl, de') &&
    !bossGen.includes('bitmap_boss_table_ix:\n    call bitmap_boss_table_ix_shadow')],
  ['Animated death without custom stamps uses visible built-in bitmap frames',
    bossGen.includes('BITMAP_BOSS_DEFAULT_DEATH_FRAME_IDS') &&
    bossGen.includes('animatedRequested && authoredIds.length === 0') &&
    bossGen.includes('animatedRequested && authoredIds.length > 0') &&
    roomGen.includes('buildDefaultBossDeathExplosionFrames') &&
    roomGen.includes('needsDefaultDeathExplosion') &&
    editor.includes('three built-in bitmap blast variants (compact mode)')],
  ['Animated frames are validated: at most 3, even width, one shared size',
    bossGen.includes('MAX_DEATH_ANIM_FRAMES') &&
    bossGen.includes('an animated explosion needs an even width') &&
    bossGen.includes('every frame of one explosion must share its size')],
  ['A project with no animated boss keeps the original 4-byte table header',
    bossGen.includes('function stripDeathFxAnimHeader') &&
    bossGen.includes('DEATH_FX_HEADER_LEGACY = 4') &&
    bossGen.includes('stripDeathFxAnimHeader(perRoom.map(entry => entry.deathFx))') &&
    bossGen.includes('const deathHeaderBytes = hasDeathAnim ?')],
  ['Animated runtime owns per-blast slots and is dispatched by the table flag',
    bossGen.includes('const hasDeathAnim =') &&
    bossGen.includes('boss_death_slots EQU') &&
    bossGen.includes('jp nz, bitmap_boss_death_update_anim') &&
    bossGen.includes('bitmap_boss_death_anim_spawn:') &&
    bossGen.includes('bitmap_boss_death_anim_advance:')],
  ['Each blast is erased by repainting the body, not the room background',
    bossGen.includes('bitmap_boss_death_anim_erase:') &&
    /bitmap_boss_death_anim_erase:[\s\S]{0,1400}?ld hl, \(boss_sx\)[\s\S]{0,400}?jp bitmap_boss_finish_hmmm/.test(bossGen)],
  ['One slot advances per frame, and a spawn never stacks on top of it',
    bossGen.includes('advance AT MOST ONE of them') &&
    bossGen.includes('.dfx_step_defer') &&
    bossGen.includes('do not stack three commands on one frame')],
  // The frames of one compact blast must animate in place: the placement PRNG is
  // seeded with a value constant within each blast (boss_death_left - selector),
  // and every frame repaints the body before stamping to avoid TIMP pile-up.
  ['A compact blast stays in place across its frames by seeding the PRNG',
    bossGen.includes('const hasDeathCompactAnim =') &&
    bossGen.includes('const hasDeathLegacyVariant =') &&
    bossGen.includes('Every frame of ONE blast must land on the SAME spot. Instead of storing') &&
    bossGen.includes('Two mixing rounds first') &&
    bossGen.includes('Wipe the previous frame by repainting the frozen body')],
  ['Finalization waits for the last explosion to finish, then the authored hold',
    bossGen.includes('call bitmap_boss_death_anim_busy') &&
    bossGen.includes('ld a, #FF') &&
    bossGen.includes('cp #FF') &&
    bossGen.includes('jp z, bitmap_boss_finalize_death   ; the hold ran out')],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log('MSX2 boss bitmap death-FX checks passed.');
