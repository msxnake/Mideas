"use strict";
/**
 * @fileoverview HUD Generator - Generates Z80 assembly for HUD rendering in Screen 2
 * Handles text-based HUD elements (Score, Lives, etc.) using TileBank fonts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHudFile = generateHudFile;
const types_1 = require("../../../types");
const globalVariablesUtils_1 = require("../../globalVariablesUtils");
function hasGlobalVariable(analysis, asmName) {
    const globals = Array.isArray(analysis.globalVariables) ? analysis.globalVariables : [];
    return globals.some(variable => String(variable?.asmName || '').trim().toLowerCase() === asmName.toLowerCase());
}
function findGlobalVariable(analysis, rawName) {
    const globals = Array.isArray(analysis.globalVariables) ? analysis.globalVariables : [];
    const normalizedName = (0, globalVariablesUtils_1.normalizeGlobalVariableName)(rawName || '').trim().toLowerCase();
    if (!normalizedName)
        return null;
    return globals.find(variable => {
        const variableName = (0, globalVariablesUtils_1.normalizeGlobalVariableName)(String(variable?.name || '')).trim().toLowerCase();
        const asmName = String(variable?.asmName || '').trim().toLowerCase();
        return variableName === normalizedName || asmName === normalizedName;
    }) || null;
}
function resolveHudDynamicFieldBinding(element, index, analysis) {
    if (element.type === types_1.HUDElementType.Score || element.type === types_1.HUDElementType.Lives) {
        return null;
    }
    const rawText = String(element.text || element.name || '');
    const details = element.details || {};
    const explicitVariableName = [details.variableName, details.globalVariableName, details.bindingVariable]
        .find(value => typeof value === 'string' && value.trim().length > 0);
    const placeholderMatch = rawText.match(/\{\{\s*([^{}]+?)\s*\}\}/);
    const placeholderVariableName = placeholderMatch?.[1]?.trim();
    const variableName = explicitVariableName || placeholderVariableName;
    if (!variableName) {
        return null;
    }
    const variable = findGlobalVariable(analysis, variableName);
    if (!variable?.asmName) {
        return null;
    }
    const isWord = ['word', '16bit'].includes(String(variable.type || '').toLowerCase());
    const requestedDigits = Number(details.digits);
    const hasRequestedDigits = Number.isFinite(requestedDigits) && requestedDigits > 0;
    const fallbackDigits = isWord ? 5 : 3;
    const digitMatch = /\d+(?!.*\d)/.exec(rawText);
    let digits = hasRequestedDigits ? Math.floor(requestedDigits) : fallbackDigits;
    let fieldOffset = rawText.length;
    let staticText = rawText;
    if (placeholderMatch && typeof placeholderMatch.index === 'number') {
        fieldOffset = placeholderMatch.index;
        staticText = `${rawText.slice(0, fieldOffset)}${'0'.repeat(digits)}${rawText.slice(fieldOffset + placeholderMatch[0].length)}`;
    }
    else if (digitMatch && typeof digitMatch.index === 'number') {
        fieldOffset = digitMatch.index;
        if (!hasRequestedDigits) {
            digits = Math.max(1, digitMatch[0].length);
        }
        staticText = `${rawText.slice(0, fieldOffset)}${'0'.repeat(digits)}${rawText.slice(fieldOffset + digitMatch[0].length)}`;
    }
    else {
        staticText = `${rawText}${'0'.repeat(digits)}`;
    }
    const tileX = Math.floor((element.position?.x || 0) / 8) + fieldOffset;
    const tileY = Math.floor((element.position?.y || 0) / 8);
    return {
        index,
        asmName: String(variable.asmName),
        digits,
        fieldOffset,
        isWord,
        staticText,
        vramAddress: 0x1800 + (tileY * 32) + tileX,
    };
}
function getHudDynamicFieldBindings(hudElements, analysis) {
    return hudElements
        .map((element, index) => resolveHudDynamicFieldBinding(element, index, analysis))
        .filter((binding) => binding !== null);
}
/**
 * Generate HUD system ASM code
 */
function generateHudFile(analysis) {
    // Collect all HUD elements from all screens
    const allHudElements = [];
    const screenHudMap = new Map();
    // Diagnostic logging to help debug HUD element detection
    console.log(`🎯 [HUD Generator] Total screens: ${analysis.screenMaps?.length || 0}`);
    analysis.screenMaps?.forEach(screen => {
        const hasHudConfig = !!screen.hudConfiguration;
        const hudElements = screen.hudConfiguration?.elements || [];
        console.log(`  📺 Screen "${screen.name}" (${screen.id}): hudConfiguration=${hasHudConfig}, elements=${hudElements.length}`);
        if (hudElements.length > 0) {
            hudElements.forEach((el, i) => console.log(`    📝 Element[${i}]: type=${el.type}, name="${el.name}", text="${el.text || ''}" pos=(${el.position.x},${el.position.y}) visible=${el.visible}`));
            allHudElements.push(...hudElements);
            screenHudMap.set(screen.id, hudElements);
        }
    });
    console.log(`🎯 [HUD Generator] Total HUD elements found: ${allHudElements.length}`);
    if (allHudElements.length === 0) {
        return `; ==================================================================
; HUD SYSTEM (EMPTY - No HUD elements defined)
; ==================================================================
render_hud:
    ret
force_render_hud:
    ret
update_hud_score:
    ret
update_hud_lives:
    ret
`;
    }
    let asm = `; ==================================================================
; HUD SYSTEM - Screen 2 Text Rendering
; ==================================================================
; Total HUD Elements: ${allHudElements.length}
; Screens with HUD: ${screenHudMap.size}
;
; HUD Elements use TileBank fonts to render text in Screen 2 mode
; Each element can be positioned anywhere on screen (256x192 pixels)
; ==================================================================

`;
    // Generate HUD data structures
    asm += generateHudDataStructures(allHudElements, analysis);
    // Determine HUD row count from activeAreaY
    let hudRows = 0;
    analysis.screenMaps?.forEach(screen => {
        const areaY = screen.activeAreaY ?? 0;
        if (areaY > hudRows)
            hudRows = areaY;
    });
    // Generate imprimir_marco function (prints frame once at screen load)
    asm += generateImprimirMarcoFunction(allHudElements);
    // Generate main render_hud function
    asm += generateRenderHudFunction(allHudElements, hudRows, analysis);
    // Generate helper functions
    asm += generateHudHelperFunctions(allHudElements, analysis);
    return asm;
}
/**
 * Generate HUD data structures
 */
function generateHudDataStructures(hudElements, analysis) {
    let asm = `; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

`;
    const dynamicFieldBindings = getHudDynamicFieldBindings(hudElements, analysis);
    const dynamicFieldBindingMap = new Map(dynamicFieldBindings.map(binding => [binding.index, binding]));
    // Generate element count
    asm += `HUD_ELEMENT_COUNT   EQU ${hudElements.length}\n\n`;
    // Generate element data table
    asm += `; HUD Element Data Table\n`;
    asm += `; Format: [Type:1][X:1][Y:1][Width:1][Height:1][Flags:1][TextPtr:2][Visible:1]\n`;
    asm += `hud_element_data:\n`;
    hudElements.forEach((el, index) => {
        const typeId = getHudElementTypeId(el.type);
        const x = el.position.x;
        const y = el.position.y;
        const visible = el.visible ? 1 : 0;
        const textLabel = `hud_text_${index}`;
        // Calculate dimensions and flags
        let width = 0;
        let height = 1; // Default height (rows)
        let flags = 0;
        // Check for border/frame
        // We check 'details.border' (from TextBox) or 'details.borderColor' (from EnergyBar etc)
        const details = el.details || {};
        if (details.border || details.borderColor || details.overallBorderColor) {
            flags |= 1; // Bit 0: Draw Border
        }
        // Calculate width based on text length or explicit width
        const renderedText = dynamicFieldBindingMap.get(index)?.staticText || el.text || el.name || '';
        if (renderedText) {
            width = renderedText.length;
        }
        else if (details.width) {
            width = Math.ceil(details.width / 8); // Convert pixels to tiles if needed
        }
        else {
            width = 10; // Default fallback
        }
        // Adjust for frame padding if border is enabled
        if (flags & 1) {
            // If border is enabled, we assume the text is inside, so we might need to expand the area?
            // For now, let's assume Width/Height are the CONTENT dimensions.
            // The draw_frame routine will draw AROUND this content.
        }
        asm += `    DB ${typeId}, ${x}, ${y}    ; Element ${index}: ${el.type} at (${x},${y})\n`;
        asm += `    DB ${width}, ${height}, ${flags} ; W, H, Flags\n`;
        asm += `    DW ${textLabel}             ; Text pointer\n`;
        asm += `    DB ${visible}                ; Visible\n`;
    });
    asm += '\n';
    // Generate text strings
    asm += `; HUD Text Strings\n`;
    hudElements.forEach((el, index) => {
        const text = dynamicFieldBindingMap.get(index)?.staticText || el.text || el.name || '';
        const textLabel = `hud_text_${index}`;
        asm += `${textLabel}:\n`;
        asm += `    DB "${text}", 0\n`;
    });
    asm += '\n';
    return asm;
}
/**
 * Generate imprimir_marco function (prints HUD frame once at screen load)
 * This function should be called ONCE when loading a screen, not every frame
 */
function generateImprimirMarcoFunction(hudElements) {
    let asm = `; ------------------------------------------------------------------
; imprimir_marco
; Draw HUD frame borders (called once per screen load)
; ------------------------------------------------------------------
imprimir_marco:
    push af
    push bc
    push de
    push hl
    push ix

    ld b, HUD_ELEMENT_COUNT
    ld ix, hud_element_data

.marco_loop:
    push bc                     ; Save counter

    ; Check visible flag first (offset 8)
    ld a, (ix+8)                ; A = Visible
    or a
    jr z, .skip_marco           ; Skip if not visible

    ; Read element fields
    ld d, (ix+1)                ; D = X position (pixels)
    ld e, (ix+2)                ; E = Y position (pixels)
    ld b, (ix+3)                ; B = Width (tiles)
    ld c, (ix+4)                ; C = Height (tiles)
    ld a, (ix+5)                ; A = Flags

    ; Check if border flag is set (bit 0)
    bit 0, a
    jr z, .skip_marco           ; Skip if no border

    ; Convert X,Y pixels to Tile coordinates
    ; TileX = X/8, TileY = Y/8
    ld a, d
    srl a
    srl a
    srl a
    ld d, a                     ; D = Tile X

    ld a, e
    srl a
    srl a
    srl a
    ld e, a                     ; E = Tile Y

    ; Adjust for padding: Frame is 1 tile larger on all sides
    dec d                       ; Frame X = Content X - 1
    dec e                       ; Frame Y = Content Y - 1

    ; Frame Width = Content Width + 2
    inc b
    inc b                       ; Width += 2

    inc c
    inc c                       ; Height += 2

    call hud_draw_frame

.skip_marco:
    ; Move to next element
    ld bc, 9                    ; Size of each element entry
    add ix, bc                  ; IX points to next element

    pop bc                      ; Restore counter
    djnz .marco_loop

    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

`;
    return asm;
}
/**
 * Generate main render_hud function
 */
function generateRenderHudFunction(hudElements, hudRows, analysis) {
    // NOTE: imprimir_marco should be called once per screen load to draw frames
    // render_hud only updates text, NOT the frame
    const clearHudArea = '';
    const scoreIndex = hudElements.findIndex(el => el.type === types_1.HUDElementType.Score);
    const livesIndex = hudElements.findIndex(el => el.type === types_1.HUDElementType.Lives);
    const dynamicFieldBindings = getHudDynamicFieldBindings(hudElements, analysis);
    const hasScoreGlobal = hasGlobalVariable(analysis, 'global_var_score');
    const hasLivesGlobal = hasGlobalVariable(analysis, 'global_var_lives');
    const dynamicSyncCode = `${scoreIndex >= 0 && hasScoreGlobal ? `
    ; Re-apply dynamic Score digits after redrawing static HUD text.
    ld a, (global_var_score)
    ld l, a
    ld a, (global_var_score+1)
    ld h, a
    call update_hud_score
` : scoreIndex >= 0 ? `
    ; Score HUD present but global_var_score is not allocated in this project.
` : ''}${livesIndex >= 0 && hasLivesGlobal ? `
    ; Re-apply dynamic Lives digit after redrawing static HUD text.
    ld a, (global_var_lives)
    call update_hud_lives
` : livesIndex >= 0 ? `
    ; Lives HUD present but global_var_lives is not allocated in this project.
` : ''}${dynamicFieldBindings.map(binding => `
    ; Re-apply HUD-bound numeric field ${binding.index} from ${binding.asmName}.
${binding.isWord ? `    ld a, (${binding.asmName})
    ld l, a
    ld a, (${binding.asmName}+1)
    ld h, a` : `    ld a, (${binding.asmName})
    ld l, a
    ld h, 0`}
    call update_hud_dynamic_${binding.index}
`).join('')}`;
    return `; ------------------------------------------------------------------
; render_hud
; Main HUD rendering function
; Only redraws when hud_dirty_flag is set
; Input:
;   None
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL, IX
; Notes:
;   - Returns immediately if hud_dirty_flag = 0
;   - Re-applies dynamic numeric fields (Score/Lives/custom bindings) after redrawing static text
; ------------------------------------------------------------------
render_hud:
    ld a, (hud_dirty_flag)
    or a
    ret z                       ; Skip if HUD hasn't changed
    xor a
    ld (hud_dirty_flag), a      ; Clear flag after rendering
    push af
    push bc
    push de
    push hl
    push ix
${clearHudArea}
    ld b, HUD_ELEMENT_COUNT
    ld ix, hud_element_data

.render_loop:
    push bc                     ; Save counter

    ; Check visible flag first (offset 8)
    ld a, (ix+8)                ; A = Visible
    or a
    jr z, .skip_element         ; Skip if not visible

    ; Read element fields
    ld d, (ix+1)                ; D = X position (pixels)
    ld e, (ix+2)                ; E = Y position (pixels)
    ld b, (ix+3)                ; B = Width (tiles)
    ld c, (ix+4)                ; C = Height (tiles)
    ld a, (ix+5)                ; A = Flags

    ; Save values we'll need later
    push bc                     ; Save Width, Height
    push de                     ; Save X, Y

    ; ---------------------------------------------------------
    ; 1. Draw Frame (if enabled)
    ; ---------------------------------------------------------
    bit 0, a                    ; Check Bit 0 (Border)
    jr z, .no_border

    ; Convert X,Y pixels to Tile coordinates
    ; TileX = X/8, TileY = Y/8
    ld a, d
    srl a
    srl a
    srl a
    ld d, a                     ; D = Tile X
    
    ld a, e
    srl a
    srl a
    srl a
    ld e, a                     ; E = Tile Y
    
    ; Adjust for padding: Frame is 1 tile larger on all sides
    dec d                       ; Frame X = Content X - 1
    dec e                       ; Frame Y = Content Y - 1
    
    ; Frame Width = Content Width + 2
    inc b
    inc b                       ; Width += 2
    
    inc c
    inc c                       ; Height += 2
    
    call hud_draw_frame
    
    ; Restore original X, Y, Width, Height for text rendering
    pop de                      ; DE = X, Y (pixels)
    pop bc                      ; BC = Width, Height (tiles)
    ; Re-push in same order as original (BC bottom, DE top)
    push bc                     ; Save Width, Height (bottom)
    push de                     ; Save X, Y (top)

.no_border:
    ; ---------------------------------------------------------
    ; 2. Draw Text
    ; ---------------------------------------------------------
    pop de                      ; DE = X, Y (pixels)
    pop bc                      ; BC = Width, Height (discard, not needed)

    ; Calculate VRAM address from X,Y pixel coordinates
    ; Screen 2 Name Table = #1800 + (Y/8)*32 + (X/8)
    
    ; Y/8 = row
    ld a, e                     ; A = Y
    srl a
    srl a
    srl a                       ; A = Y/8 (row)

    ; row * 32
    ld l, a
    ld h, 0
    add hl, hl                  ; * 2
    add hl, hl                  ; * 4
    add hl, hl                  ; * 8
    add hl, hl                  ; * 16
    add hl, hl                  ; * 32

    ; Add X/8
    ld a, d                     ; A = X
    srl a
    srl a
    srl a                       ; A = X/8 (column)
    ld e, a
    ld d, 0
    add hl, de

    ; Add Name Table base
    ld de, #1800
    add hl, de                  ; HL = VRAM address

    ; Get Text Pointer
    ld e, (ix+6)                ; TextPtr Low
    ld d, (ix+7)                ; TextPtr High
    ; DE = Text Pointer

    ; Render text string at HL (VRAM) from DE (string)
    call hud_print_string

.skip_element:
    ; Move to next element
    ld bc, 9                    ; Size of each element entry
    add ix, bc                  ; IX points to next element

    pop bc                      ; Restore counter
    djnz .render_loop
${dynamicSyncCode}

    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; force_render_hud
; Force a HUD redraw on this frame, preserving caller-visible registers
; Input:
;   None
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL, IX
; Notes:
;   - Sets hud_dirty_flag = 1 and then calls render_hud
; ------------------------------------------------------------------
force_render_hud:
    push af
    ld a, 1
    ld (hud_dirty_flag), a
    call render_hud
    pop af
    ret

`;
}
/**
 * Generate HUD helper functions
 */
function generateHudHelperFunctions(hudElements, analysis) {
    const scoreIndex = hudElements.findIndex(el => el.type === types_1.HUDElementType.Score);
    const livesIndex = hudElements.findIndex(el => el.type === types_1.HUDElementType.Lives);
    const scoreElement = scoreIndex >= 0 ? hudElements[scoreIndex] : null;
    const livesElement = livesIndex >= 0 ? hudElements[livesIndex] : null;
    const scoreLabel = scoreIndex >= 0 ? `hud_text_${scoreIndex}` : null;
    const livesLabel = livesIndex >= 0 ? `hud_text_${livesIndex}` : null;
    const dynamicFieldBindings = getHudDynamicFieldBindings(hudElements, analysis);
    const getNumericFieldInfo = (text, fallbackDigits) => {
        const safeText = text || '';
        const match = /\d+(?!.*\d)/.exec(safeText);
        if (!match || typeof match.index !== 'number') {
            return { offset: safeText.length, digits: fallbackDigits };
        }
        return {
            offset: match.index,
            digits: Math.max(1, match[0].length),
        };
    };
    const scoreText = scoreElement?.text || scoreElement?.name || '';
    const livesText = livesElement?.text || livesElement?.name || '';
    const scoreField = getNumericFieldInfo(scoreText, 5);
    const livesField = getNumericFieldInfo(livesText, 1);
    const getFieldVramAddress = (element, fieldOffset) => {
        if (!element)
            return null;
        const x = Math.floor((element.position?.x || 0) / 8) + fieldOffset;
        const y = Math.floor((element.position?.y || 0) / 8);
        return 0x1800 + (y * 32) + x;
    };
    const scoreFieldVramAddress = getFieldVramAddress(scoreElement, scoreField.offset);
    const livesFieldVramAddress = getFieldVramAddress(livesElement, livesField.offset);
    const buildDecimalWriteCode = (digits, scoreMode = false) => {
        const safeDigits = Math.max(1, digits);
        const supportedDigits = Math.min(safeDigits, 5);
        const leadingZeroCount = Math.max(0, safeDigits - supportedDigits);
        const availableDivisors = [10000, 1000, 100, 10];
        const divisors = availableDivisors.slice(availableDivisors.length - Math.max(0, supportedDigits - 1));
        const leadingZeroCode = Array.from({ length: leadingZeroCount }, (_, index) => `    ; Leading digit ${index}: forced zero (${scoreMode ? 'Score' : '16-bit value'} max 65535)
    ld a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
`).join('');
        const digitCode = divisors.map((divisor, index) => `    ; Runtime digit ${index}: / ${divisor}
    ld bc, ${divisor}
    call hud_div16
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
`).join('');
        return `${leadingZeroCode}${digitCode}    ; Final digit: ones (remainder)
    ld a, l
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
`;
    };
    const scoreWriteCode = buildDecimalWriteCode(scoreField.digits, true);
    const dynamicFieldHelpers = dynamicFieldBindings.map(binding => `; ------------------------------------------------------------------
; update_hud_dynamic_${binding.index}
; Update HUD-bound numeric field ${binding.index} from HL value
; Input: HL = Current value (16-bit binary, 0-65535)
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL
; Notes:
;   - Writes only the numeric digits in VRAM; the static label is not touched
; ------------------------------------------------------------------
update_hud_dynamic_${binding.index}:
    push af
    push bc
    push de
    push hl

    ld de, #${binding.vramAddress.toString(16).toUpperCase()}

${buildDecimalWriteCode(binding.digits)}    pop hl
    pop de
    pop bc
    pop af
    ret

`).join('');
    return `; ------------------------------------------------------------------
; hud_print_string
; Print a null-terminated string to Screen 2 Name Table
; Input: HL = VRAM address, DE = String pointer (RAM)
; ------------------------------------------------------------------
hud_print_string:
    push af
    push bc
    push de
    push hl

.print_loop:
    ld a, (de)                  ; Get character from string
    or a                        ; Check for null terminator
    jr z, .print_done

    cp 32                       ; Check if >= 32 (printable ASCII)
    jr nc, .valid_char
    ld a, 32                    ; Replace control chars with space
.valid_char:
    push de
    call FAST_WRTVRM
    pop de
    inc de
    inc hl
    jr .print_loop

.print_done:
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; hud_ascii_to_tile
; Convert ASCII character to tile index for font rendering
; Input: A = ASCII character
; Output: A = Tile index (ASCII code for direct mapping)
; ------------------------------------------------------------------
hud_ascii_to_tile:
    cp 32
    ret nc
    ld a, 32
    ret

; ------------------------------------------------------------------
; hud_draw_frame
; Draw a rectangular frame using font characters
; Input: D = Tile X, E = Tile Y, B = Width (tiles), C = Height (tiles)
; Uses characters: 43 (+), 45 (-), 124 (|)
; ------------------------------------------------------------------
hud_draw_frame:
    push af
    push bc
    push de
    push hl
    ld l, e
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, d
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de
    push hl
    push bc
    ld a, 43
    call FAST_WRTVRM
    inc hl
    ld a, b
    sub 2
    jr z, .skip_top_edge
    jr c, .skip_top_edge
    ld b, a
.top_edge_loop:
    ld a, 45
    call FAST_WRTVRM
    inc hl
    djnz .top_edge_loop
.skip_top_edge:
    ld a, 43
    call FAST_WRTVRM
    pop bc
    pop hl
    ld de, 32
    add hl, de
    ld a, c
    sub 2
    jr z, .bottom_row
    jr c, .bottom_row
    ld c, a
.middle_row_loop:
    push hl
    push bc
    ld a, 124
    call FAST_WRTVRM
    ld a, b
    dec a
    ld e, a
    ld d, 0
    add hl, de
    ld a, 124
    call FAST_WRTVRM
    pop bc
    pop hl
    ld de, 32
    add hl, de
    dec c
    jr nz, .middle_row_loop
.bottom_row:
    ld a, 43
    call FAST_WRTVRM
    inc hl
    ld a, b
    sub 2
    jr z, .skip_bottom_edge
    jr c, .skip_bottom_edge
    ld b, a
.bottom_edge_loop:
    ld a, 45
    call FAST_WRTVRM
    inc hl
    djnz .bottom_edge_loop
.skip_bottom_edge:
    ld a, 43
    call FAST_WRTVRM
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; update_hud_score
; Update score HUD element with current score value
; Input: HL = Score value (16-bit binary, 0-65535)
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
update_hud_score:
${scoreLabel ? `    push af
    push bc
    push de
    push hl

    ld de, #${(scoreFieldVramAddress || 0).toString(16).toUpperCase()}

${scoreWriteCode}    pop hl
    pop de
    pop bc
    pop af` : `    ; No Score element defined in HUD`}
    ret

; Helper: HL = HL / BC, A = quotient, HL = remainder
hud_div16:
    xor a
.hud_div16_loop:
    or a
    sbc hl, bc
    jr c, .hud_div16_done
    inc a
    jr .hud_div16_loop
.hud_div16_done:
    add hl, bc
    ret

; ------------------------------------------------------------------
; update_hud_lives
; Update lives HUD element
; Input: A = Number of lives (0-9)
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, HL
; ------------------------------------------------------------------
update_hud_lives:
${livesLabel ? `    push af
    push hl
    add a, '0'
    ld hl, #${(livesFieldVramAddress || 0).toString(16).toUpperCase()}
    call FAST_WRTVRM
    pop hl
    pop af` : `    ; No Lives element defined in HUD`}
    ret

${dynamicFieldHelpers}`;
}
/**
 * Get HUD element type ID for ASM
 */
function getHudElementTypeId(type) {
    const typeMap = {
        [types_1.HUDElementType.Score]: 1,
        [types_1.HUDElementType.HighScore]: 2,
        [types_1.HUDElementType.Lives]: 3,
        [types_1.HUDElementType.EnergyBar]: 4,
        [types_1.HUDElementType.ItemDisplay]: 5,
        [types_1.HUDElementType.SceneName]: 6,
        [types_1.HUDElementType.MiniMap]: 7,
        [types_1.HUDElementType.CoinCounter]: 8,
        [types_1.HUDElementType.BossEnergyBar]: 9,
        [types_1.HUDElementType.PhaseIndicator]: 10,
        [types_1.HUDElementType.AttackAlert]: 11,
        [types_1.HUDElementType.TextBox]: 12,
        [types_1.HUDElementType.NumericField]: 13,
        [types_1.HUDElementType.CustomCounter]: 14,
    };
    return typeMap[type] || 0;
}
