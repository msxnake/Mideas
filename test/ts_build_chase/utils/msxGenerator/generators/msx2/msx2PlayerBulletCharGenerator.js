"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerBulletCharSettings = getPlayerBulletCharSettings;
exports.buildMsx2ReadCurrentScreenNameByteAsm = buildMsx2ReadCurrentScreenNameByteAsm;
exports.buildMsx2PlayerBulletCharCoreAsm = buildMsx2PlayerBulletCharCoreAsm;
exports.buildPlayerBulletCharSlotUpdateAsm = buildPlayerBulletCharSlotUpdateAsm;
exports.buildPlayerBulletCharSpawnAsm = buildPlayerBulletCharSpawnAsm;
const formatHexWord = (value) => `#${Math.max(0, Math.min(0xFFFF, Math.floor(value) || 0)).toString(16).toUpperCase().padStart(4, '0')}`;
function getPlayerBulletCharSettings(analysis, getProjectileEntity, getTileBytes, getPrimaryScreen) {
    const screen = getPrimaryScreen(analysis);
    const projectile = getProjectileEntity(analysis);
    const charCode = Math.max(1, Math.min(255, Math.floor(Number(projectile?.components?.msx2_char_render?.charCode
        ?? projectile?.params?.charCode
        ?? 13) || 13)));
    const bytes = getTileBytes(screen, projectile);
    const pattern = (bytes?.pattern || []).slice(0, 8);
    const color = (bytes?.color || []).slice(0, 8);
    while (pattern.length < 8)
        pattern.push(0xFF);
    while (color.length < 8)
        color.push(0x6E);
    return { charCode, pattern: pattern.slice(0, 8), color: color.slice(0, 8) };
}
function buildMsx2ReadCurrentScreenNameByteAsm(tileScreenLoadLabels, useKonamiDataBank, payloadDataBankConstants) {
    if (!tileScreenLoadLabels.length) {
        return `msx2_read_current_screen_name_byte:
    ; DE=NAMES offset. Returns A=0 when no screens are configured.
    xor a
    ret
`;
    }
    const checks = tileScreenLoadLabels.map((label, index) => `    cp ${index}
    jp z, .read_name_${label}`).join('\n');
    const cases = tileScreenLoadLabels.map(label => {
        const namesLabel = `${label}_NAMES`;
        const enter = useKonamiDataBank
            ? `    ld a, ${payloadDataBankConstants?.get(namesLabel) || `${label}_DATA_BANK`}
    call msx2_screen4_data_bank_enter_selected
`
            : '';
        const leave = useKonamiDataBank ? '    call msx2_screen4_data_bank_leave\n' : '';
        return `.read_name_${label}:
${enter}    ld hl, ${namesLabel}
    add hl, de
    ld a, (hl)
${leave}    ret`;
    }).join('\n');
    return `msx2_read_current_screen_name_byte:
    ; DE=byte offset in authored NAMES table. Returns A=char code. Clobbers AF/BC/HL.
    ld a, (msx2_current_screen_index)
${checks}
    xor a
    ret
${cases}`;
}
function buildMsx2PlayerBulletCharCoreAsm(settings, tileScreenLoadLabels, useKonamiDataBank, payloadDataBankConstants) {
    const charCode = settings.charCode;
    const runtimeCharCopy = (label, tableBase) => [0x0000, 0x0800, 0x1000].map(bankOffset => `    ld hl, ${label}
    ld de, ${formatHexWord(tableBase + bankOffset + (charCode * 8))}
    ld bc, 8
    call LDIRVM`).join('\n');
    return `${buildMsx2ReadCurrentScreenNameByteAsm(tileScreenLoadLabels, useKonamiDataBank, payloadDataBankConstants)}

screen4_names_offset_from_bc:
    ; B=pixel X, C=pixel Y. Returns DE=byte offset in authored NAMES (row*32+col).
    ; Clobbers AF/HL. Preserves BC.
    push bc
    ld a, c
    srl a
    srl a
    srl a
    ld c, a
    ld a, b
    srl a
    srl a
    srl a
    ld b, a
    ld d, 0
    ld e, c
    ld h, d
    ld l, e
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld d, h
    ld e, l
    ld a, b
    add a, e
    ld e, a
    ld d, 0
    pop bc
    ret

screen4_name_vram_addr_from_bc:
    ; B=pixel X, C=pixel Y. Returns HL=SCREEN 4 name-table VRAM address.
    ; Clobbers AF/DE/HL. Preserves BC.
    push bc
    call screen4_names_offset_from_bc
    ld h, d
    ld l, e
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, #1800
    add hl, de
    pop bc
    ret

msx2_restore_background_char_8:
    ; B=pixel X, C=pixel Y. Restores one authored 8x8 background char from cold NAMES.
    ; Uses msx2_score_work_lo/hi as a short-lived offset scratch. Clobbers AF/BC/DE/HL.
    push bc
    call screen4_names_offset_from_bc
    ld a, e
    ld (msx2_score_work_lo), a
    ld a, d
    ld (msx2_score_work_hi), a
    pop bc
    push bc
    call screen4_name_vram_addr_from_bc
    pop bc
    push hl
    ld a, (msx2_score_work_lo)
    ld e, a
    ld a, (msx2_score_work_hi)
    ld d, a
    call msx2_read_current_screen_name_byte
    pop hl
    jp WRTVRM

msx2_draw_player_bullet_char_8:
    ; B=pixel X, C=pixel Y. Draws the player bullet 8x8 char. Clobbers AF/BC/DE/HL.
    call screen4_name_vram_addr_from_bc
    ld a, ${charCode}
    jp WRTVRM

init_msx2_player_bullet_char:
    ; Copies the player bullet 8x8 pattern/color into all three SCREEN 4 banks.
    ; Clobbers AF/BC/DE/HL.
${runtimeCharCopy('msx2_player_bullet_pattern', 0x0000)}
${runtimeCharCopy('msx2_player_bullet_color', 0x2000)}
    ret
`;
}
function buildPlayerBulletCharSlotUpdateAsm(options) {
    const { slot, horizontal, speedX, speedY, } = options;
    const suffix = slot === 0 ? '0' : '1';
    const activeVar = slot === 0 ? 'msx2_player_bullet_active' : 'msx2_player_bullet_1_active';
    const xVar = slot === 0 ? 'msx2_player_bullet_x' : 'msx2_player_bullet_1_x';
    const yVar = slot === 0 ? 'msx2_player_bullet_y' : 'msx2_player_bullet_1_y';
    const deactivateLabel = `msx2_deactivate_player_bullet_slot_${suffix}`;
    const afterMoveLabel = `.bullet_slot_${suffix}_after_move`;
    const moveLeftLabel = `.bullet_slot_${suffix}_move_left`;
    const effectCheck = slot === 0 ? 'msx2_player_bullet_check_effect_collision' : 'msx2_player_bullet_1_check_effect_collision';
    const enemyCheck = slot === 0 ? 'msx2_player_bullet_check_enemy_collision' : 'msx2_player_bullet_1_check_enemy_collision';
    const moveAsm = horizontal
        ? `    ld a, (${activeVar})
    cp 2
    jp z, ${moveLeftLabel}
    ld a, b
    add a, ${speedX}
    jp c, ${deactivateLabel}
    cp 244
    jp nc, ${deactivateLabel}
    ld (${xVar}), a
    jp ${afterMoveLabel}
${moveLeftLabel}:
    ld a, b
    sub ${speedX}
    jp c, ${deactivateLabel}
    cp 4
    jp c, ${deactivateLabel}
    ld (${xVar}), a`
        : `    ld a, b
    cp 8
    jp c, ${deactivateLabel}
    sub ${speedY}
    ld (${yVar}), a`;
    return `update_msx2_player_bullet_slot_${suffix}:
    ld a, (${activeVar})
    or a
    ret z
    ld a, (${xVar})
    ld b, a
    ld a, (${yVar})
    ld c, a
    call msx2_restore_background_char_8
    ld a, (${xVar})
    ld b, a
    ld a, (${yVar})
    ld c, a
${moveAsm}
${afterMoveLabel}:
    ld a, (${activeVar})
    or a
    ret z
    ld a, (${xVar})
    ld b, a
    ld a, (${yVar})
    ld c, a
    call msx2_draw_player_bullet_char_8
    call ${effectCheck}
    ld a, (${activeVar})
    or a
    ret z
    call ${enemyCheck}
    ret

${deactivateLabel}:
    ld a, (${xVar})
    ld b, a
    ld a, (${yVar})
    ld c, a
    call msx2_restore_background_char_8
    xor a
    ld (${activeVar}), a
    ret
`;
}
function buildPlayerBulletCharSpawnAsm(options) {
    const { slot, horizontal, cooldownFrames } = options;
    const suffix = slot === 0 ? '0' : '1';
    const activeVar = slot === 0 ? 'msx2_player_bullet_active' : 'msx2_player_bullet_1_active';
    const xVar = slot === 0 ? 'msx2_player_bullet_x' : 'msx2_player_bullet_1_x';
    const yVar = slot === 0 ? 'msx2_player_bullet_y' : 'msx2_player_bullet_1_y';
    if (horizontal) {
        return `.bullet_spawn_slot_${suffix}:
    ld a, (msx2_player_sprite_x)
    add a, 6
    and #F8
    ld (${xVar}), a
    ld a, (msx2_player_sprite_y)
    add a, 6
    and #F8
    ld (${yVar}), a
    ld a, (msx2_player_sprite_dx)
    cp #FF
    jp z, .bullet_spawn_slot_${suffix}_left
    ld a, 1
    jp .bullet_spawn_slot_${suffix}_store_active
.bullet_spawn_slot_${suffix}_left:
    ld a, 2
.bullet_spawn_slot_${suffix}_store_active:
    ld (${activeVar}), a
    ld a, ${cooldownFrames}
    ld (msx2_player_bullet_cooldown), a
    ld a, (${xVar})
    ld b, a
    ld a, (${yVar})
    ld c, a
    call msx2_draw_player_bullet_char_8
    call msx2_sfx_fire
    ret
`;
    }
    return `.bullet_spawn_slot_${suffix}:
    ld a, (msx2_player_sprite_x)
    add a, 6
    and #F8
    ld (${xVar}), a
    ld a, (msx2_player_sprite_y)
    cp 8
    jp c, .bullet_spawn_slot_${suffix}_top
    sub 8
    and #F8
    jp .bullet_spawn_slot_${suffix}_store_y
.bullet_spawn_slot_${suffix}_top:
    xor a
.bullet_spawn_slot_${suffix}_store_y:
    ld (${yVar}), a
    ld a, 1
    ld (${activeVar}), a
    ld a, ${cooldownFrames}
    ld (msx2_player_bullet_cooldown), a
    ld a, (${xVar})
    ld b, a
    ld a, (${yVar})
    ld c, a
    call msx2_draw_player_bullet_char_8
    call msx2_sfx_fire
    ret
`;
}
