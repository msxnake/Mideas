/**
 * @fileoverview Unified Generator - All-in-one combined file
 * Generates unitedFiles.asm combining all modular files into one
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { buildBankPackReport, formatBankPackReportAsAsmComments } from '../utils/bankPacker';
import type { ExecutionPlan } from '../types/executionTypes';
import { buildPage0Plan, hasPage0DataGroups, page0NeedsZx0Decoder } from './page0Generator';
import { getFontRawData, getFontBank4Data } from './fontGenerator';
import { buildScreenResourcePolicyManifest, getPresentationScreenBank4Data, getScreensBank4Data } from './screensGenerator';
import { getPatternsBank4Data } from './patternsGenerator';
import { getColorsBank4Data } from './colorsGenerator';
import { buildWorldSpritePatternPolicyManifest, getSpritesBank4Data } from './spritesGenerator';
import { getSoundBank4Data } from './soundGenerator';
import { buildWorldMusicPolicyManifest } from './worldGenerator';
import { getZx0DecoderAsm } from './zx0Utils';
import { getMapperWindowConfig } from './mapperWindowUtils';
import { packMegaromDataGroups } from '../utils/megaromDataPacker';
import {
    buildMegaromGeneratedArtifacts,
    renderMegaromGeneratedArtifactsAsCommentBlocks,
    renderNamedArtifactAsCommentBlock,
} from '../utils/megaromResourceArtifacts';

/**
 * Convert routine name to lowercase (for labels, CALL, JP, JR targets)
 */
function toRoutineLabel(name: string): string {
    return name.toLowerCase();
}

function formatExecutionPlanComments(executionPlan: ExecutionPlan): string {
    const irqTasks = executionPlan.tasks.length > 0
        ? executionPlan.tasks.map((task) => `; IRQ Task: slot ${task.slot} -> ${task.routineLabel} (${task.responsibility}, every ${task.period} frame${task.period === 1 ? '' : 's'})`).join('\n')
        : '; IRQ Task: none';
    const mainlineWork = executionPlan.mainline.length > 0
        ? executionPlan.mainline.map((item) => `; Mainline: ${item.phase} -> ${item.routineLabel} (${item.responsibility})`).join('\n')
        : '; Mainline: none';
    const warnings = executionPlan.diagnostics.warnings.length > 0
        ? executionPlan.diagnostics.warnings.map((warning) => `; Warning: ${warning}`).join('\n')
        : '; Warning: none';

    return `; Engine Execution Mode: ${executionPlan.mode}\n${irqTasks}\n${mainlineWork}\n${warnings}\n`;
}

/**
 * Interface for generated ASM files
 */
export interface GeneratedASMFiles {
    'page0.asm': string;
    'bios.asm': string;
    'constants.asm': string;
    'variables.asm': string;
    'mapper.asm': string;
    'resource_ids.asm': string;
    'resource_table.asm': string;
    'resource_manager.asm': string;
    'interrupt.asm': string;
    'header.asm': string;
    'components.asm': string;
    'entities.asm': string;
    'screens.asm': string;
    'patterns.asm': string;
    'colors.asm': string;
    'sprites.asm': string;
    'font.asm': string;
    'hud.asm': string;
    'menus.asm': string;
    'sound.asm': string;
    'scroll.asm': string;
    'animtiles.asm': string;
    'statemachine.asm': string;
    'gameflow.asm': string;
    'worlds.asm': string;
    'main.asm': string;
    'unitedFiles.asm'?: string;
}

export type UnifiedMapperFormat = 'konami' | 'ascii8' | 'ascii16';
export type UnifiedRomMode = 'auto' | 'simple32k' | 'plain48k' | 'megarom';

export interface UnifiedGenerationConfig {
    romMode: UnifiedRomMode;
    targetFormat: UnifiedMapperFormat;
    autoMegaROM: boolean;
}

/**
 * Generate unified file (unitedFiles.asm) - optional all-in-one file
 *
 * @param files - All generated ASM files
 * @param projectName - Name of the project
 * @param analysis - Project analysis with assets and configuration
 * @param config - ROM mode/mapper configuration
 * @returns ASM code string with all files combined
 */
export function generateUnifiedFile(
    files: GeneratedASMFiles,
    projectName: string,
    analysis: ProjectAnalysis,
    executionPlan: ExecutionPlan,
    config: UnifiedGenerationConfig = {
        romMode: 'simple32k',
        targetFormat: 'konami',
        autoMegaROM: false
    }
): string {
    // Check what features are needed
    const hasPresentationScreenNode = analysis.gameFlow?.nodes?.some(node => node.type === 'PresentationScreen');
    const hasMenus = analysis.gameFlow?.nodes?.some(node => node.type === 'SubMenu');
    const hasText = analysis.screenMaps?.some(screen =>
        (screen.layers as any)?.text || (screen as any).textElements?.length > 0
    );
    const hasDialogue = analysis.dialogues?.some((dialogue: any) =>
        Array.isArray(dialogue?.lines) && dialogue.lines.some((line: any) => String(line?.text || '').length > 0)
    );
    const hasHud = analysis.screenMaps?.some(screen =>
        screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0
    );
    const needsFont = hasMenus || hasText || hasHud || hasDialogue;
    const fontInPage0 = config.romMode === 'plain48k' && !!needsFont;
    const fontRawData = fontInPage0 ? getFontRawData(analysis) : undefined;
    const page0Plan = buildPage0Plan(analysis, config.romMode, fontRawData);
    const hasPage0Data = hasPage0DataGroups(analysis, config.romMode, fontRawData);
    const bankPackReport = buildBankPackReport(files as unknown as Record<string, string>);
    const bankPackComments = formatBankPackReportAsAsmComments(bankPackReport);
    const executionPlanComments = formatExecutionPlanComments(executionPlan);
    const needsZx0Decoder = page0NeedsZx0Decoder(analysis, config.romMode, fontRawData);

    // Megarom uses a completely separate bank-aware layout
    if (config.romMode === 'megarom') {
        return generateMegaromUnifiedFile(
            files, projectName, analysis, executionPlan, config,
            { bankPackComments, executionPlanComments, hasMenus, needsFont, hasHud, hasPresentationScreenNode }
        );
    }

    return `; ==================================================================
; ${projectName.toUpperCase()} - UNIFIED FILE
; File: unitedFiles.asm
; Description: All-in-one file combining all modular files
; Generated by Mideas MSX Modular Generator
;
; OPTIMIZED: Only includes necessary code for this project
; Tiles: ${analysis.tiles?.length || 0}
; Sprites: ${analysis.sprites?.length || 0}
; Screens: ${analysis.screenMaps?.length || 0}
; Entities: ${analysis.entities?.length || 0}
; Menus: ${hasMenus ? 'Yes' : 'No'}
; HUD: ${hasHud ? 'Yes' : 'No'}
; State Machines: ${analysis.stateMachines?.length || 0}
; ROM Mode: ${config.romMode}
; Mapper Target: ${config.targetFormat}
; Auto MegaROM: ${config.autoMegaROM ? 'Yes' : 'No'}
${executionPlanComments}; ==================================================================
${config.romMode === 'plain48k' ? `; Linear48K Page0 Data: ${hasPage0Data ? 'Yes' : 'No'}\n; Page0 Used Bytes: ${page0Plan.usedBytes}\n; Page0 Remaining Bytes: ${page0Plan.remainingBytes}\n; EXPERIMENTAL: linear 48K page-0 data groups currently start with Presentation Screen.\n` : ''}${bankPackComments}

${config.romMode === 'plain48k' ? `; ==================================================================
; LINEAR 48K PAGE 0 SCAFFOLD
; ==================================================================
    org #0000
${files['page0.asm']}
    ds #4000 - $

` : ''}
; CRITICAL: header.asm with ORG #4000 and "AB" signature MUST be first
; for the ROM to work correctly after the optional page-0 scaffold.
${files['header.asm']}

${needsZx0Decoder ? `; ZX0 decoder required by page-0 compressed cold data.
${getZx0DecoderAsm()}

` : ''}

${files['bios.asm']}

${files['constants.asm']}

${files['variables.asm']}

${files['mapper.asm']}

${files['interrupt.asm']}

${analysis.tiles && analysis.tiles.length > 0 ? files['patterns.asm'] : '; [patterns.asm skipped - no tiles]\n'}

${analysis.tiles && analysis.tiles.length > 0 ? files['colors.asm'] : '; [colors.asm skipped - no tiles]\n'}

${files['sprites.asm']}

${analysis.screenMaps && analysis.screenMaps.length > 0 || hasPresentationScreenNode ? files['screens.asm'] : '; [screens.asm skipped - no screens]\n'}

${files['components.asm']}

${analysis.entities && analysis.entities.length > 0 ? files['entities.asm'] : '; [entities.asm skipped - no entities]\n'}

${hasMenus ? files['menus.asm'] : '; [menus.asm skipped - no menus]\n'}

${needsFont ? files['font.asm'] : `; [font.asm skipped - no text/menus]
init_font_system:
    ret

reload_font_system:
    ret

`}

${files['hud.asm']}

${files['sound.asm']}

${files['scroll.asm']}

${files['animtiles.asm']}

${files['statemachine.asm'] && files['statemachine.asm'].trim() !== '; No State Machines' ? files['statemachine.asm'] : '; [statemachine.asm skipped - no state machines]\n'}

${analysis.gameFlow ? files['gameflow.asm'] : '; [gameflow.asm skipped - no GameFlow]\n'}

${files['worlds.asm']}

; ==================================================================
; GAME SYSTEM FUNCTIONS
; ==================================================================
; NOTE: The main game loop and execution flow are handled exclusively
; by GameFlow (see gameflow.asm section above).
; This section only contains shared initialization and utility functions.
; ==================================================================

;-----------------------------------------------
; Capture the normal expanded slot used by each page.
init_page0_runtime_state:
    in a, (#A8)
    ld (slot_primary_normal), a
    ld e, a
    ld a, e
    and #03
    call GETSLOT
    ld (page0_bios_slot), a
    ld a, e
    rrca
    rrca
    and #03
    call GETSLOT
    ld (ROM_slot), a
    ld a, e
    rrca
    rrca
    rrca
    rrca
    and #03
    call GETSLOT
    ld (page2_normal_slot), a
    ld a, e
    rlca
    rlca
    and #03
    call GETSLOT
    ld (page3_normal_slot), a
    ret

;-----------------------------------------------
; Map page 0 to the expanded slot passed in A while restoring page 3 afterwards.
; input:
;   a: expanded slot for page 0 target
; output:
;   page 0 remapped
;   page 3 restored to its normal RAM slot
;   interrupts remain disabled on return
page0_map_expanded_slot:
    ld c, a
    ld a, (slot_primary_normal)
    ; Keep pages 1-3 exactly as they were; only replace page 0 primary slot bits.
    and #FC
    ld b, a
    ld a, c
    and #03
    or b
    di
    out (#A8), a

    ld a, c
    and #80
    ret z
    ld a, c
    and #0C
    rrca
    rrca
    ld b, a
    ld a, (ROM_slot)
    and #0C
    or b
    ld b, a
    ld a, (page2_normal_slot)
    and #0C
    rlca
    rlca
    or b
    ld b, a
    ld a, (page3_normal_slot)
    and #0C
    rlca
    rlca
    rlca
    rlca
    or b
    ld (#FFFF), a
    ret

;-----------------------------------------------
; Switch page 0 to the cartridge ROM slot while keeping page 3 in RAM.
page0_map_game_rom:
    ; IRQs must stay disabled while BIOS page 0 is hidden, otherwise IM1 jumps to #0038
    ; inside cartridge data/ZX0 blobs and execution derails.
    di
    ld a, (ROM_slot)
    jp page0_map_expanded_slot

;-----------------------------------------------
; Restore the normal BIOS-ROM-ROM-RAM slot layout after a page-0 copy.
page0_restore_bios_rom:
    ld a, (page0_bios_slot)
    call page0_map_expanded_slot
    ei
    ret

;-----------------------------------------------
; Copy one chunk from page 0 ROM into the RAM transfer buffer.
; input:
;   hl: source in page 0
;   bc: chunk size (1..256)
; output:
;   hl: source advanced by chunk size
page0_copy_chunk_to_buffer:
    call page0_map_game_rom
    ld de, page0_transfer_buffer
    ldir
    jp page0_restore_bios_rom

;-----------------------------------------------
; Decompress ZX0 data stored in page 0 into a RAM destination.
; input:
;   hl: compressed source in page 0
;   de: destination in RAM
page0_decompress_to_ram:
${needsZx0Decoder ? `    ; page0_map_game_rom uses E/C/B as scratch while rebuilding slot registers.
    ; Preserve DE so dzx0_standard receives the caller's RAM destination intact.
    push de
    call page0_map_game_rom
    pop de
    call dzx0_standard
    jp page0_restore_bios_rom
` : `    ; No page-0 ZX0 blocks in this build. Keep the label for compatibility.
    ret
`}

;-----------------------------------------------
; Copy cold data from page 0 ROM to VRAM using a RAM buffer.
; input:
;   hl: source in page 0
;   de: destination VRAM
;   bc: byte count
page0_copy_to_vram:
    ld a, b
    or c
    ret z
.page0_copy_loop:
    push bc
    ld a, b
    or a
    jr z, .page0_copy_final_chunk
    ld bc, #0100
    jr .page0_copy_chunk_ready
.page0_copy_final_chunk:
    ; Final chunk keeps the original BC (1..255 bytes).
.page0_copy_chunk_ready:
    push bc
    push de
    call page0_copy_chunk_to_buffer
    pop de
    pop bc
    push hl
    push bc
    ld hl, page0_transfer_buffer
    call FAST_LDIRVM
    pop bc
    pop hl
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    ld a, b
    or a
    jr z, .page0_copy_done
    dec b
    ld a, b
    or c
    jp nz, .page0_copy_loop
.page0_copy_done:
    ret

init_game_systems:
    call DISSCR               ; Disable screen while loading VRAM assets
    ; Cold boot / restart must not trust cached VRAM state from RAM contents.
    xor a
    ld (vram_cache_tile_patterns_ready), a
    ld (vram_cache_tile_colors_ready), a
    ld (vram_cache_font_ready), a
    ld a, #FF
    ld (current_screen2_tilebank_id), a
${analysis.globalVariables && analysis.globalVariables.length > 0 ? `    call init_all_global_variables
` : `    ; No global variables - skip initialization
`}
${analysis.entities && analysis.entities.length > 0 ? `    ; Initialize component systems (entities detected)
    call init_components
` : `    ; No entities - skipping component system initialization
`}
${analysis.tiles && analysis.tiles.length > 0 ? `    ; Load pattern and color data (tiles detected)
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
` : `    ; No tiles detected - skipping pattern/color loading
`}
    ; Initialize animated tile runtime (safe no-op if no animated groups)
    call init_animated_tiles

${analysis.entities && analysis.entities.length > 0 ? `    ; Initialize game entities with real positions from JSON
    call init_entities
` : `    ; No entities to initialize
`}
${analysis.screenMaps && analysis.screenMaps.length > 0 ? `    ; Load the first game screen
    call load_game_screen
    call rebuild_used_entity_list
` : `    ; No screens - skip screen loading
`}
${needsFont ? `    ; Initialize font system
    call init_font_system
` : `    ; No text/menus - skip font initialization
`}${hasHud ? `    ; HUD dirty flag - will be rendered after screen loading (by GameFlow WorldLink)
    ld a, 1
    ld (hud_dirty_flag), a
` : ``}
    call ENASCR               ; Re-enable screen after VRAM updates
    ret

; ==================================================================
; SCREEN LOADING STUB (for compatibility)
; ==================================================================
; NOTE: With GameFlow system, screen loading is handled by GameFlow nodes
; via load_world_X -> load_screen_X. This stub exists for backward
; compatibility with init_game_systems references.
load_game_screen:
    ret

${config.romMode === 'plain48k' ? `    ds #C000 - $        ; Pad linear 48K ROM to 49152 bytes

` : ''}    end                 ; End of assembly
`;
}

// ==================================================================
// MEGAROM UNIFIED FILE GENERATOR
// ==================================================================
// Layout: N banks × 8KB, static 4-bank mapping + dynamic data banking
//
// STATIC MAP (always visible, set at boot in restart_rom_continue):
//   Bank 0 @ 4000h-5FFFh : Bootstrap (header, bios, mapper, interrupt, init helpers)
//   Bank 1 @ 6000h-7FFFh : Game code A (components, scroll, gameflow, worlds)
//   Bank 2 @ 8000h-9FFFh : Game data  (sprites, patterns, colors, screens, animtiles)
//   Bank 3 @ A000h-BFFFh : Game code B (entities, statemachine, font, menus, hud, sound)
//
// DYNAMIC BANKING (P2 window, bank 4+):
//   Large data that overflows bank 2 is placed in banks 4+ (ORG #C000, #E000, #10000…).
//   Loading routines switch P2 to the target bank, copy via FAST_LDIRVM, then restore P2.
//   Data HL address uses (label & #1FFF) | #8000 (window-relative formula).
//
// BANK NUMBER FORMULA (assembly-time constant):
//   BANK_N EQU ((label - #4000) / #2000)
//   Works for all ORG values: #4000→0, #6000→1, #8000→2, #A000→3,
//   #C000→4, #E000→5, #10000→6, #12000→7, …
//
// Note: DS padding between banks produces a compile error if a bank overflows 8KB.
// For large projects (>8KB per bank section), split into additional banks.
// ==================================================================

// ==================================================================
// FFD (First-Fit Decreasing) Bank Packer for MegaROM code banks 1-3
// ==================================================================

const MEGAROM_BANK_SIZE = 8192;
// FFD packer threshold: use full 8KB.
// estimateAsmBytesLocal overestimates by ~5-10x so virtually every module exceeds this
// and gets its own bank slot — which is intentional (one module per physical bank).
const MEGAROM_CODE_BANK_SIZE = MEGAROM_BANK_SIZE; // 8192 bytes

// Resident execution kernel for MegaROM.
// These modules must remain in the three fixed windows because the boot code,
// main game loop, and entity/state updates execute every frame.
const RESIDENT_MODULE_WINDOW_ORDER = [
    { key: 'components', orgAddress: 0x6000, endAddress: 0x8000, windowPage: 1 },
    { key: 'statemachine', orgAddress: 0x8000, endAddress: 0xA000, windowPage: 2 },
    { key: 'gameflow', orgAddress: 0xA000, endAddress: 0xC000, windowPage: 3 },
] as const;

const RESIDENT_MODULE_KEYS = new Set<string>(RESIDENT_MODULE_WINDOW_ORDER.map((slot) => slot.key));

interface PackedBankModule {
    key: string;
    content: string;
    estimatedBytes: number;
}

interface PackedBank {
    physicalBank: number; // 1-based: 1, 2, 3, 4, ...
    orgAddress: number;   // #6000, #8000, #A000 (cyclic for far banks)
    endAddress: number;   // #8000, #A000, #C000
    modules: PackedBankModule[];
    usedBytes: number;
    isFar: boolean;       // true if physicalBank > 3 (requires far-call trampolines)
    windowPage: number;   // 1=P1(#6000), 2=P2(#8000), 3=P3(#A000)
}

function estimateAsmBytesLocal(asm: string): number {
    if (!asm) return 0;
    let dataBytes = 0;
    const lines = asm.split(/\r?\n/);
    for (const line of lines) {
        const clean = line.split(';')[0].trim();
        if (!clean) continue;
        const dbMatch = clean.match(/^db\s+(.+)$/i);
        if (dbMatch) { dataBytes += dbMatch[1].split(',').filter(t => t.trim().length > 0).length; continue; }
        const dwMatch = clean.match(/^dw\s+(.+)$/i);
        if (dwMatch) { dataBytes += dwMatch[1].split(',').filter(t => t.trim().length > 0).length * 2; continue; }
        const dsMatch = clean.match(/^ds\s+([^,]+)/i);
        if (dsMatch) {
            const v = dsMatch[1].trim().toLowerCase();
            const n = /^\d+$/.test(v) ? parseInt(v, 10) : /^#([0-9a-f]+)$/.test(v) ? parseInt(v.slice(1), 16) : 0;
            if (n > 0) dataBytes += n;
        }
    }
    const textBytes = asm.length;
    return Math.max(dataBytes, Math.floor(textBytes * 0.28));
}

// Cyclic ORG/end addresses for primary code slots (P1, P2, P3 windows)
const CODE_SLOT_ORG  = [0x6000, 0x8000, 0xA000];
const CODE_SLOT_END  = [0x8000, 0xA000, 0xC000];
const CODE_SLOT_PAGE = [1, 2, 3]; // mapper window page index

// Far code must not execute from P2 because runtime loaders use P2 as the
// data window. If a far routine running at #8000 switches data banks, it hides
// its own code and returns into garbage.
const FAR_CODE_SLOT_ORG  = [0x6000, 0xA000];
const FAR_CODE_SLOT_END  = [0x8000, 0xC000];
const FAR_CODE_SLOT_PAGE = [1, 3];

function packModulesFFD(modules: PackedBankModule[]): PackedBank[] {
    const banks: PackedBank[] = [];

    // Keep the resident execution kernel in fixed windows 1-3.
    RESIDENT_MODULE_WINDOW_ORDER.forEach((slot, index) => {
        const module = modules.find((candidate) => candidate.key === slot.key);
        banks.push({
            physicalBank: index + 1,
            orgAddress: slot.orgAddress,
            endAddress: slot.endAddress,
            modules: module ? [module] : [],
            usedBytes: module ? module.estimatedBytes : 0,
            isFar: false,
            windowPage: slot.windowPage,
        });
    });

    // Everything else is explicitly banked and accessed through bank-0 wrappers/trampolines.
    const bankedModules = modules
        .filter((module) => !RESIDENT_MODULE_KEYS.has(module.key))
        .sort((a, b) => b.estimatedBytes - a.estimatedBytes);

    for (const module of bankedModules) {
        const slotIndex = banks.length;
        const physicalBank = slotIndex + 1;
        const farSlotIndex = slotIndex - RESIDENT_MODULE_WINDOW_ORDER.length;
        const cycleIdx = farSlotIndex % FAR_CODE_SLOT_ORG.length;
        banks.push({
            physicalBank,
            orgAddress: FAR_CODE_SLOT_ORG[cycleIdx],
            endAddress: FAR_CODE_SLOT_END[cycleIdx],
            modules: [module],
            usedBytes: module.estimatedBytes,
            isFar: true,
            windowPage: FAR_CODE_SLOT_PAGE[cycleIdx],
        });
    }

    return banks;
}

function formatPackedBankLayoutComment(banks: PackedBank[]): string {
    const lines = [
        '; ------------------------------------------------------------------',
        '; DYNAMIC BANK PACKER (FFD) — Estimated layout for code banks',
        '; ------------------------------------------------------------------',
    ];
    for (const bank of banks) {
        const orgHex = bank.orgAddress.toString(16).toUpperCase().padStart(4, '0');
        const endHex = bank.endAddress.toString(16).toUpperCase().padStart(4, '0');
        const moduleList = bank.modules.map(m => m.key).join(', ') || '(empty)';
        const farTag = bank.isFar ? ' [FAR — accessed via trampoline]' : '';
        lines.push(`; Bank ${bank.physicalBank} [#${orgHex}-#${endHex}]: ${moduleList} (${bank.usedBytes}/${MEGAROM_CODE_BANK_SIZE} bytes est.)${farTag}`);
    }
    lines.push('; Bank 4+ (data) [#C000+]: DATA (patterns, colors, screens, font, presentation)');
    lines.push('; ------------------------------------------------------------------');
    return lines.join('\n');
}

// ==================================================================
// FAR-CALL TRAMPOLINE SUPPORT
// ==================================================================
// Far banks (physicalBank > 3) are not statically mapped at boot.
// Callers in bank 0 use trampolines that:
//   1. push/save the current P1 bank
//   2. map the far bank to P1 (#6000)
//   3. call the routine (which runs at its normal ORG address in P1)
//   4. restore the original P1 bank
//
// The far bank's modules are assembled with the same ORG as their
// windowPage (e.g. #6000 for windowPage=1). Because they contain
// different labels from the primary bank at the same ORG, Glass
// has no label conflicts. At runtime the CPU executes from the
// correct physical bank via the trampoline.
// ==================================================================

/**
 * Return the known callable entry points for a given module key.
 * These are the labels that can be invoked from bank 0 / primary banks.
 */
function getKnownEntryPoints(moduleKey: string, analysis: ProjectAnalysis): string[] {
    switch (moduleKey) {
        case 'patterns_code':
            return [
                'load_pattern_bank0',
                'load_pattern_bank1',
                'load_pattern_bank2',
                'load_patterns_to_vram',
            ];
        case 'colors_code':
            return [
                'load_color_bank0',
                'load_color_bank1',
                'load_color_bank2',
                'load_colors_to_vram',
            ];
        case 'entities':
            return ['init_entities'];
        case 'worlds': {
            const worldMaps = (analysis as any).worldmaps || [];
            const pts: string[] = ['load_world_default', 'check_world_screen_transition'];
            worldMaps.forEach((world: any, _wi: number) => {
                const worldId = (world.id || 'unknown').toLowerCase().replace(/[^a-z0-9_]/g, '_');
                pts.push(`load_world_${worldId}`);
                const connections = world.connections || [];
                connections.forEach((_c: any, ci: number) => {
                    pts.push(`transition_${worldId}_${ci}`);
                });
            });
            return pts;
        }
        case 'screens_code': {
            const screenMaps = analysis.screenMaps || [];
            const importedHudFrameDrawLabels = screenMaps
                .map((screen: any) => {
                    const screenName = (screen.name || 'unknown').toUpperCase().replace(/[^A-Z0-9]/g, '_').toLowerCase();
                    const screenIdSuffix = screen.id ? `_${screen.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
                    return `hud_imported_frame_${screenName}${screenIdSuffix.toLowerCase()}_draw`;
                });
            return [
                ...screenMaps.map((screen: any) => {
                const screenName = (screen.name || 'unknown').toUpperCase().replace(/[^A-Z0-9]/g, '_').toLowerCase();
                const screenIdSuffix = screen.id ? `_${screen.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
                return `load_screen_${screenName}${screenIdSuffix.toLowerCase()}`;
                }),
                ...importedHudFrameDrawLabels,
                'show_presentation_screen',
                'set_screen_colors',
                'init_char0_color',
            ];
        }
        case 'font':
            return ['init_font_system', 'reload_font_system'];
        case 'menus':
            return ['render_menu', 'init_menu_system'];
        case 'hud':
            return ['render_hud', 'force_render_hud', 'imprimir_marco', 'init_hud'];
        case 'sound':
            return ['init_sound_system', 'task_audio_tick', 'sfx_update', 'music_update', 'music_stop', 'music_play_track', 'music_execute_command'];
        case 'statemachine':
            return ['init_statemachine_system', 'update_statemachine_system', 'execute_all_state_machines'];
        case 'gameflow':
            return ['game_loop', 'gameflow_update'];
        case 'sprites':
            return [
                'init_sprites',
                'update_sprites_to_vram',
                'clear_all_sprites',
                'hide_sprite',
                'load_sprite_patterns_by_pack_id',
                'ensure_sprite_patterns_by_pack_id',
                'ensure_sprite_patterns_for_world_id',
            ];
        case 'animtiles':
            return ['init_animated_tiles', 'update_animated_tiles', 'update_animated_tiles_vram'];
        default:
            return [];
    }
}

/**
 * Generate far-call trampolines in bank 0 for all far-bank modules.
 * Each trampoline uses the correct mapper window (pX) matching the far bank's ORG address:
 *   windowPage 1 (#6000) → mapper_push_p1 / mapper_set_bank_p1 / mapper_pop_p1
 *   windowPage 2 (#8000) → mapper_push_p2 / mapper_set_bank_p2 / mapper_pop_p2
 *   windowPage 3 (#A000) → mapper_push_p3 / mapper_set_bank_p3 / mapper_pop_p3
 * All trampolines live in bank 0 (fixed #4000-#5FFF) so they are always reachable.
 */
function generateFarCallTrampolines(farBanks: PackedBank[], analysis: ProjectAnalysis): string {
    if (farBanks.length === 0) return '';

    const preserveAEntryPoints = new Set([
        'hide_sprite',
        'load_sprite_patterns_by_pack_id',
        'ensure_sprite_patterns_by_pack_id',
        'ensure_sprite_patterns_for_world_id',
        'set_screen_colors',
        'init_char0_color',
    ]);

    let asm = `; ==================================================================
; FAR-CALL TRAMPOLINES — bank 0 (always accessible at #4000-#5FFF)
; Far banks are mapped to their window temporarily, routine is called,
; then the original bank is restored. Window used matches the bank ORG.
; ==================================================================

`;

    for (const bank of farBanks) {
        const bankNum = bank.physicalBank;
        const wp = bank.windowPage; // 1, 2 or 3
        const orgHex = bank.orgAddress.toString(16).toUpperCase().padStart(4, '0');
        asm += `; --- Far bank ${bankNum} [#${orgHex}, window P${wp}] trampolines ---\n`;
        asm += `FAR_BANK_${bankNum} EQU ${bankNum}\n\n`;

        for (const mod of bank.modules) {
            const eps = getKnownEntryPoints(mod.key, analysis);
            const content = mod.content || '';
            for (const ep of eps) {
                // Only generate trampolines for labels actually defined in the module
                const labelPattern = new RegExp(`^${ep}:`, 'm');
                if (!labelPattern.test(content)) {
                    continue; // Skip — label not defined in this module
                }
                asm += `${ep}_far:\n`;
                if (preserveAEntryPoints.has(ep)) {
                    asm += `    ex af, af'\n`;
                    asm += `    ld a, i\n`;
                    asm += `    push af\n`;
                    asm += `    di\n`;
                    asm += `    ld a, (mapper_bank_p${wp}_current)\n`;
                    asm += `    push af\n`;
                    asm += `    ld a, FAR_BANK_${bankNum}\n`;
                    asm += `    call mapper_set_bank_p${wp}\n`;
                    asm += `    ex af, af'\n`;
                    asm += `    call ${ep}\n`;
                    asm += `    ex af, af'\n`;
                    asm += `    pop af\n`;
                    asm += `    call mapper_set_bank_p${wp}\n`;
                    asm += `    pop af\n`;
                    asm += `    jp po, .${ep}_far_irq_done\n`;
                    asm += `    ei\n`;
                    asm += `.${ep}_far_irq_done:\n`;
                    asm += `    ex af, af'\n`;
                    asm += `    ret\n\n`;
                    continue;
                }
                asm += `    push af\n`;
                asm += `    ld a, i\n`;
                asm += `    push af\n`;
                asm += `    di\n`;
                asm += `    ld a, (mapper_bank_p${wp}_current)\n`;
                asm += `    push af\n`;
                asm += `    ld a, FAR_BANK_${bankNum}\n`;
                asm += `    call mapper_set_bank_p${wp}\n`;
                asm += `    call ${ep}\n`;
                asm += `    pop af\n`;
                asm += `    call mapper_set_bank_p${wp}\n`;
                asm += `    pop af\n`;
                asm += `    jp po, .${ep}_far_irq_done\n`;
                asm += `    ei\n`;
                asm += `.${ep}_far_irq_done:\n`;
                asm += `    pop af\n`;
                asm += `    ret\n\n`;
            }
        }
    }

    return asm;
}

/**
 * Given the set of far module keys, return the correct call label for an entry point.
 * If the entry point is in a far module → append "_far", else use it directly.
 */
function farCallLabel(ep: string, farModuleKeys: Set<string>, moduleKey: string): string {
    return farModuleKeys.has(moduleKey) ? `${ep}_far` : ep;
}

function collectDefinedLabels(files: GeneratedASMFiles): Set<string> {
    const labels = new Set<string>();
    const labelPattern = /^([A-Za-z_][A-Za-z0-9_]*):/gm;

    (Object.keys(files) as Array<keyof GeneratedASMFiles>).forEach((fileKey) => {
        const asm = files[fileKey] || '';
        for (const match of asm.matchAll(labelPattern)) {
            labels.add(match[1]);
        }
    });

    return labels;
}

function replaceCallInstruction(asm: string, fromLabel: string, toLabel: string): string {
    const pattern = new RegExp(`\\bcall\\s+${fromLabel}\\b`, 'g');
    return asm.replace(pattern, `call ${toLabel}`);
}

function rewriteResidentCallSites(files: GeneratedASMFiles): GeneratedASMFiles {
    const rewritten: GeneratedASMFiles = { ...files };
    const replacements: Array<[string, string]> = [
        ['check_world_screen_transition', 'call_check_world_screen_transition_resident'],
        ['reload_font_system', 'call_reload_font_system_resident'],
        ['init_font_system', 'call_init_font_system_resident'],
        ['render_hud', 'call_render_hud_resident'],
        ['force_render_hud', 'call_force_render_hud_resident'],
        ['init_sound_system', 'call_init_sound_system_resident'],
        ['task_audio_tick', 'call_task_audio_tick_resident'],
        ['music_update', 'call_music_update_resident'],
        ['sfx_update', 'call_sfx_update_resident'],
        ['music_stop', 'call_music_stop_resident'],
        ['music_play_track', 'call_music_play_track_resident'],
        ['music_execute_command', 'call_music_execute_command_resident'],
        ['init_sprites', 'call_init_sprites_resident'],
        ['show_sprite', 'call_show_sprite_resident'],
        ['load_sprite_patterns_by_pack_id', 'call_load_sprite_patterns_by_pack_id_resident'],
        ['ensure_sprite_patterns_by_pack_id', 'call_ensure_sprite_patterns_by_pack_id_resident'],
        ['ensure_sprite_patterns_for_world_id', 'call_ensure_sprite_patterns_for_world_id_resident'],
        ['set_screen_colors', 'call_set_screen_colors_resident'],
        ['init_char0_color', 'call_init_char0_color_resident'],
        ['update_sprites_to_vram', 'call_update_sprites_to_vram_resident'],
        ['clear_all_sprites', 'call_clear_all_sprites_resident'],
        ['hide_sprite', 'call_hide_sprite_resident'],
        ['init_animated_tiles', 'call_init_animated_tiles_resident'],
        ['update_animated_tiles', 'call_update_animated_tiles_resident'],
        ['update_animated_tiles_vram', 'call_update_animated_tiles_vram_resident'],
        ['load_colors_to_vram', 'call_load_colors_to_vram_resident'],
    ];

    (Object.keys(rewritten) as Array<keyof GeneratedASMFiles>).forEach((fileKey) => {
        let asm = rewritten[fileKey];
        for (const [fromLabel, toLabel] of replacements) {
            asm = replaceCallInstruction(asm, fromLabel, toLabel);
        }
        rewritten[fileKey] = asm;
    });

    return rewritten;
}

function generateResidentCallWrappers(
    farModuleKeys: Set<string>,
    availableLabels: Set<string>
): string {
    const resolveResidentTarget = (label: string, moduleKey: string): string => {
        const target = farCallLabel(label, farModuleKeys, moduleKey);
        return availableLabels.has(target) ? target : 'resident_noop';
    };

    const checkWorldScreenTransitionCall = resolveResidentTarget('check_world_screen_transition', 'worlds');
    const initFontCall = resolveResidentTarget('init_font_system', 'font');
    const reloadFontCall = resolveResidentTarget('reload_font_system', 'font');
    const renderHudCall = resolveResidentTarget('render_hud', 'hud');
    const forceRenderHudCall = resolveResidentTarget('force_render_hud', 'hud');
    const initSoundCall = resolveResidentTarget('init_sound_system', 'sound');
    const musicUpdateCall = resolveResidentTarget('music_update', 'sound');
    const sfxUpdateCall = resolveResidentTarget('sfx_update', 'sound');
    const musicStopCall = resolveResidentTarget('music_stop', 'sound');
    const musicPlayTrackCall = resolveResidentTarget('music_play_track', 'sound');
    const musicExecuteCommandCall = resolveResidentTarget('music_execute_command', 'sound');
    const initAnimatedTilesCall = resolveResidentTarget('init_animated_tiles', 'animtiles');
    const updateAnimatedTilesCall = resolveResidentTarget('update_animated_tiles', 'animtiles');
    const updateAnimatedTilesVramCall = resolveResidentTarget('update_animated_tiles_vram', 'animtiles');
    const loadColorsToVramCall = resolveResidentTarget('load_colors_to_vram', 'colors_code');
    const initSpritesCall = resolveResidentTarget('init_sprites', 'sprites');
    const loadSpritePatternsByPackCall = resolveResidentTarget('load_sprite_patterns_by_pack_id', 'sprites');
    const ensureSpritePatternsByPackCall = resolveResidentTarget('ensure_sprite_patterns_by_pack_id', 'sprites');
    const ensureSpritePatternsForWorldCall = resolveResidentTarget('ensure_sprite_patterns_for_world_id', 'sprites');
    const setScreenColorsCall = resolveResidentTarget('set_screen_colors', 'screens_code');
    const initChar0ColorCall = resolveResidentTarget('init_char0_color', 'screens_code');

    return `; ==================================================================
; RESIDENT CALL WRAPPERS — bank 0 stable entrypoints
; Mainline code calls these labels instead of calling banked modules directly.
; Each wrapper dispatches to the local label or its _far trampoline.
; ==================================================================
call_check_world_screen_transition_resident:
    jp ${checkWorldScreenTransitionCall}

call_init_font_system_resident:
    jp ${initFontCall}

call_reload_font_system_resident:
    jp ${reloadFontCall}

call_render_hud_resident:
    jp ${renderHudCall}

call_force_render_hud_resident:
    jp ${forceRenderHudCall}

call_init_sound_system_resident:
    jp ${initSoundCall}

call_task_audio_tick_resident:
    ; Keep IRQ audio dispatch resident: music_update may live in a far
    ; sound bank, while SM_UpdateSound lives in the primary statemachine
    ; window. Running the original task_audio_tick inside the sound bank
    ; would hide SM_UpdateSound and jump into the wrong bank.
    push af
    push bc
    push de
    push hl
    call call_music_update_resident
${availableLabels.has('SM_UpdateSound') ? `    call SM_UpdateSound
` : ``}    pop hl
    pop de
    pop bc
    pop af
    ret

call_music_update_resident:
    jp ${musicUpdateCall}

call_sfx_update_resident:
    jp ${sfxUpdateCall}

call_music_stop_resident:
    jp ${musicStopCall}

call_music_play_track_resident:
    jp ${musicPlayTrackCall}

call_music_execute_command_resident:
    jp ${musicExecuteCommandCall}

call_init_sprites_resident:
    jp ${initSpritesCall}

call_load_sprite_patterns_by_pack_id_resident:
    jp ${loadSpritePatternsByPackCall}

call_ensure_sprite_patterns_by_pack_id_resident:
    jp ${ensureSpritePatternsByPackCall}

call_ensure_sprite_patterns_for_world_id_resident:
    jp ${ensureSpritePatternsForWorldCall}

call_set_screen_colors_resident:
    jp ${setScreenColorsCall}

call_init_char0_color_resident:
    jp ${initChar0ColorCall}

call_show_sprite_resident:
    cp 32
    ret nc
    push af
    ld a, c
    cp 208
    jr c, .cssr_y_ok
    ld c, SPRITE_INVISIBLE
.cssr_y_ok:
    pop af
    push de
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    pop de
    ld (hl), c
    inc hl
    ld (hl), b
    inc hl
    ld (hl), d
    inc hl
    ld (hl), e
    ld a, 1
    ld (sprites_dirty), a
    ret

call_update_sprites_to_vram_resident:
    ld a, (sprites_dirty)
    or a
    ret z
    xor a
    ld (sprites_dirty), a
    ld hl, sprite_attributes
    ld de, SPRATR
    ld bc, 44
    call FAST_LDIRVM
    ret

call_clear_all_sprites_resident:
    ld hl, sprite_attributes
    ld b, 32
    ld a, 224
.casr_loop:
    ld (hl), a
    inc hl
    inc hl
    inc hl
    inc hl
    djnz .casr_loop
    ld a, 1
    ld (sprites_dirty), a
    ret

call_hide_sprite_resident:
    cp 32
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    ld (hl), 224
    ld a, 1
    ld (sprites_dirty), a
    ret

call_init_animated_tiles_resident:
    jp ${initAnimatedTilesCall}

call_update_animated_tiles_resident:
    jp ${updateAnimatedTilesCall}

call_update_animated_tiles_vram_resident:
    jp ${updateAnimatedTilesVramCall}

call_load_colors_to_vram_resident:
    jp ${loadColorsToVramCall}

resident_noop:
    ret

`;
}

interface MegaromUnifiedOptions {
    bankPackComments: string;
    executionPlanComments: string;
    hasMenus: boolean;
    needsFont: boolean;
    hasHud: boolean;
    hasPresentationScreenNode: boolean;
}

function generateMegaromUnifiedFile(
    files: GeneratedASMFiles,
    projectName: string,
    analysis: ProjectAnalysis,
    executionPlan: ExecutionPlan,
    config: UnifiedGenerationConfig,
    options: MegaromUnifiedOptions
): string {
    const { bankPackComments, executionPlanComments, hasMenus, needsFont, hasHud, hasPresentationScreenNode } = options;

    // NOTE 2026-03-26:
    // The current MegaROM code layout below is still driven by an 8KB-first packer.
    // The long-term rule is stricter:
    // - place ZX0 assets after compression, using their final compressed sizes,
    // - keep data inside hard 8KB/16KB zones depending on mapper format,
    // - keep code in 16KB-stable regions where possible, only splitting at
    //   explicit far-call boundaries.
    // The data allocator below now enforces hard mapper-sized zones with
    // explicit padding between zones so post-export ZX0 rewrites cannot make
    // blocks drift across zone boundaries. Code placement is still an
    // implementation step, not the final 16KB-stable policy.

    // Build FFD packer layout for diagnostic comment
    // Modules are the CODE sections (data goes to bank4, so patterns/colors/screens are code-only here)
    const codeModules: PackedBankModule[] = [
        { key: 'components', content: files['components.asm'], estimatedBytes: estimateAsmBytesLocal(files['components.asm']) },
        { key: 'sprites', content: files['sprites.asm'], estimatedBytes: estimateAsmBytesLocal(files['sprites.asm']) },
        { key: 'animtiles', content: files['animtiles.asm'], estimatedBytes: estimateAsmBytesLocal(files['animtiles.asm']) },
        { key: 'scroll', content: files['scroll.asm'], estimatedBytes: estimateAsmBytesLocal(files['scroll.asm']) },
        { key: 'patterns_code', content: files['patterns.asm'], estimatedBytes: estimateAsmBytesLocal(files['patterns.asm']) },
        { key: 'colors_code', content: files['colors.asm'], estimatedBytes: estimateAsmBytesLocal(files['colors.asm']) },
        { key: 'screens_code', content: files['screens.asm'], estimatedBytes: estimateAsmBytesLocal(files['screens.asm']) },
        ...(analysis.gameFlow ? [{ key: 'gameflow', content: files['gameflow.asm'], estimatedBytes: estimateAsmBytesLocal(files['gameflow.asm']) }] : []),
        { key: 'worlds', content: files['worlds.asm'], estimatedBytes: estimateAsmBytesLocal(files['worlds.asm']) },
        ...(analysis.entities && analysis.entities.length > 0 ? [{ key: 'entities', content: files['entities.asm'], estimatedBytes: estimateAsmBytesLocal(files['entities.asm']) }] : []),
        ...(files['statemachine.asm'] && files['statemachine.asm'].trim() !== '; No State Machines' ? [{ key: 'statemachine', content: files['statemachine.asm'], estimatedBytes: estimateAsmBytesLocal(files['statemachine.asm']) }] : []),
        ...(needsFont ? [{ key: 'font', content: files['font.asm'], estimatedBytes: estimateAsmBytesLocal(files['font.asm']) }] : []),
        ...(hasMenus ? [{ key: 'menus', content: files['menus.asm'], estimatedBytes: estimateAsmBytesLocal(files['menus.asm']) }] : []),
        // Keep HUD stubs in unified output even with zero elements. Resident
        // wrappers always reference render_hud/force_render_hud.
        { key: 'hud', content: files['hud.asm'], estimatedBytes: estimateAsmBytesLocal(files['hud.asm']) },
        { key: 'sound', content: files['sound.asm'], estimatedBytes: estimateAsmBytesLocal(files['sound.asm']) },
    ].filter(m => m.estimatedBytes > 0);

    const packedBanks = packModulesFFD(codeModules);
    const packerLayoutComment = formatPackedBankLayoutComment(packedBanks);

    // Build bank4 section: sprite data + pattern data + color data + screen data + font data + presentation screen
    // assembled at org #C000. Labels accessed via P2 window using (label & #1FFF) | #8000.
    const presentationBank4Data = getPresentationScreenBank4Data(analysis);
    // MegaROM font.asm keeps a small inline copy of font patterns/colors so
    // menu/text reloads do not depend on a nested banked-resource copy.
    const fontBank4Data = '';
    const spritesBank4Data = getSpritesBank4Data(analysis);
    const patternsBank4Data = analysis.tiles && analysis.tiles.length > 0 ? getPatternsBank4Data(analysis) : '';
    const colorsBank4Data = analysis.tiles && analysis.tiles.length > 0 ? getColorsBank4Data(analysis) : '';
    const soundBank4Data = getSoundBank4Data(analysis);
    const screensBank4Data = analysis.screenMaps && analysis.screenMaps.length > 0
        ? getScreensBank4Data(analysis, config.targetFormat) : '';

    // Separate primary banks (1-3, always mapped) from far banks (4+, trampoline accessed)
    const primaryBanks = packedBanks.filter(b => !b.isFar);
    const farCodeBanks = packedBanks.filter(b => b.isFar);

    // Build set of module keys that ended up in far banks
    const farModuleKeySet = new Set<string>(farCodeBanks.flatMap(b => b.modules.map(m => m.key)));

    const emittedFiles = rewriteResidentCallSites(files);
    const availableLabels = collectDefinedLabels(emittedFiles);

    // Generate far-call trampolines for bank 0
    const farTrampolines = generateFarCallTrampolines(farCodeBanks, analysis);
    const availableWrapperTargets = new Set<string>([
        ...availableLabels,
        ...collectDefinedLabels({ 'main.asm': farTrampolines } as GeneratedASMFiles),
    ]);
    const residentCallWrappers = generateResidentCallWrappers(farModuleKeySet, availableWrapperTargets);

    // Determine whether init_entities and init_font_system are in far banks
    const initEntitiesCall = farModuleKeySet.has('entities') ? 'init_entities_far' : 'init_entities';
    const initFontCall     = farModuleKeySet.has('font')     ? 'init_font_system_far' : 'init_font_system';
    const loadPatternsToVramCall = farCallLabel('load_patterns_to_vram', farModuleKeySet, 'patterns_code');
    const loadColorsToVramCall = farCallLabel('load_colors_to_vram', farModuleKeySet, 'colors_code');
    const initAnimatedTilesCall = farCallLabel('init_animated_tiles', farModuleKeySet, 'animtiles');

    const mapperWindow = getMapperWindowConfig(config.romMode, config.targetFormat);
    const dataZoneSize = mapperWindow.dataZoneSize;
    const totalCodeBanks = packedBanks.length; // primary + far code banks (boot bank 0 not counted)
    const emittedCodeBytes = (totalCodeBanks + 1) * 0x2000; // bank0 bootstrap + packed 8KB code banks
    const alignedDataOffset = Math.ceil(emittedCodeBytes / dataZoneSize) * dataZoneSize;
    const dataOrgAddress = 0x4000 + alignedDataOffset;
    const dataStartPhysBank = (dataOrgAddress - 0x4000) / dataZoneSize;
    const dataPack = packMegaromDataGroups(
        [
            { groupName: 'sprites', asm: spritesBank4Data },
            { groupName: 'patterns', asm: patternsBank4Data },
            { groupName: 'colors', asm: colorsBank4Data },
            { groupName: 'screens', asm: screensBank4Data },
            { groupName: 'sound', asm: soundBank4Data },
            { groupName: 'font', asm: fontBank4Data },
            { groupName: 'presentation', asm: presentationBank4Data },
        ].filter((group) => group.asm.trim().length > 0),
        dataOrgAddress,
        dataZoneSize
    );

    if (dataPack.overflowBlocks.length > 0) {
        const overflowSummary = dataPack.overflowBlocks
            .map((block) => `${block.label} (${block.byteSize} bytes > zone ${dataZoneSize})`)
            .join(', ');
        throw new Error(`MegaROM data zone overflow: ${overflowSummary}`);
    }

    const generatedArtifacts = buildMegaromGeneratedArtifacts(dataPack, mapperWindow);
    const generatedArtifactMap = new Map(generatedArtifacts.map((artifact) => [artifact.fileName, artifact.content]));
    const generatedArtifactBlocks = [
        renderMegaromGeneratedArtifactsAsCommentBlocks(dataPack, mapperWindow),
        renderNamedArtifactAsCommentBlock('resource_manager.asm', files['resource_manager.asm']),
        renderNamedArtifactAsCommentBlock('world_music_policy.txt', buildWorldMusicPolicyManifest(analysis)),
        renderNamedArtifactAsCommentBlock('world_sprite_pattern_policy.txt', buildWorldSpritePatternPolicyManifest(analysis)),
        renderNamedArtifactAsCommentBlock('screen_resource_policy.txt', buildScreenResourcePolicyManifest(analysis)),
    ].join('\n\n');
    const resourceIdsAsm = generatedArtifactMap.get('resource_ids.asm') || files['resource_ids.asm'];
    const resourceTableAsm = generatedArtifactMap.get('resource_table.asm') || files['resource_table.asm'];

    const overflowDataSection = `; ==================================================================
; DATA BANKS — Zone-packed data (${dataZoneSize} bytes per zone)
; First data bank: ${dataStartPhysBank}
; Accessed through mapper ${mapperWindow.dataWindowPage.toUpperCase()} using
; (label & ${mapperWindow.windowMaskExpr}) | ${mapperWindow.windowBaseExpr}.
; BANK_NUMBER = ((label - #4000) / ${mapperWindow.bankDivisorExpr})
; NOTE: Each zone is explicitly padded to preserve bank placement even after
;       server-side ZX0 block rewrites shrink individual data blobs.
; ==================================================================
${dataPack.diagnosticsComment}

${dataPack.asm}`;

    const farCodeBanksAsmComment = farCodeBanks.length > 0
        ? `; Far code banks: ${farCodeBanks.map(b => `bank${b.physicalBank}(${b.modules.map(m=>m.key).join(',')})`).join(' ')}\n`
        : '';

    return `; ==================================================================
; ${projectName.toUpperCase()} - MEGAROM UNIFIED FILE
; File: unitedFiles.asm
; ROM Mode: megarom (multi-bank, 8KB banks, ASCII8K/Konami pattern)
; Mapper: ${config.targetFormat}
;
; Bank 0 [#4000-#5FFFh] : Bootstrap (header, bios, mapper, interrupt, init)
; Banks 1-3 [#6000-#BFFFh] : Game code — FFD-packed primary (see layout below)
; Bank 4+ (code) [far]  : Far code banks — accessed via trampolines in bank 0
; Bank 4+ (data) [#C000h+] : DATA TABLES (patterns, colors, screens, font - P2 switch)
; Generated artifacts: resource_ids.asm, resource_table.asm, resource_manager.asm, packing_manifest.txt
;
; Tiles: ${analysis.tiles?.length || 0}
; Sprites: ${analysis.sprites?.length || 0}
; Screens: ${analysis.screenMaps?.length || 0}
; Entities: ${analysis.entities?.length || 0}
; Menus: ${hasMenus ? 'Yes' : 'No'}
; HUD: ${hasHud ? 'Yes' : 'No'}
; State Machines: ${analysis.stateMachines?.length || 0}
${executionPlanComments}${packerLayoutComment}
${farCodeBanksAsmComment}${bankPackComments}; ==================================================================

${generatedArtifactBlocks}

; ##################################################################
; BANK 0 — Bootstrap (#4000h-#5FFFh, FIXED window in Konami mapper)
; Contains: header, bios, constants, variables, mapper, interrupt,
;           page-0 stubs, far-call trampolines, init_game_systems.
; All mapper_set_bank calls are here so they execute from this fixed bank.
; ##################################################################

; CRITICAL: header.asm with ORG #4000 and "AB" signature MUST be first
${emittedFiles['header.asm']}

${emittedFiles['bios.asm']}

${emittedFiles['constants.asm']}

${emittedFiles['variables.asm']}

${emittedFiles['mapper.asm']}

${resourceIdsAsm}

${resourceTableAsm}

${files['resource_manager.asm']}

; ==================================================================
; PAGE-0 STUBS — labels required by header.asm, no-ops in megarom
; ==================================================================
init_page0_runtime_state:
    ret

page0_map_expanded_slot:
    ret

page0_map_game_rom:
    ret

page0_restore_bios_rom:
    ret

page0_copy_chunk_to_buffer:
    ret

page0_decompress_to_ram:
    ret

page0_copy_to_vram:
    ret

${emittedFiles['interrupt.asm']}

${farTrampolines}${residentCallWrappers}; ==================================================================
; INIT_GAME_SYSTEMS — in bank 0 so it is reachable from any bank
; Calls routines in statically-mapped primary banks (1-3) via CALL.
; Routines in far banks (4+) are called via _far trampolines above.
; ==================================================================
init_game_systems:
    call DISSCR               ; Disable screen while loading VRAM assets
    ; Cold boot / restart must not trust cached VRAM state from RAM contents.
    xor a
    ld (vram_cache_tile_patterns_ready), a
    ld (vram_cache_tile_colors_ready), a
    ld (vram_cache_font_ready), a
    ld a, #FF
    ld (current_screen2_tilebank_id), a
${analysis.entities && analysis.entities.length > 0 ? `    ; Initialize component systems (entities detected)
    call init_components
` : `    ; No entities - skipping component system initialization
`}
${analysis.tiles && analysis.tiles.length > 0 ? `    ; Load shared gameplay pattern/color data once unless VRAM was invalidated.
    call ${loadPatternsToVramCall}
    call ${loadColorsToVramCall}
` : `    ; No tiles detected - skipping pattern/color loading
`}
    ; Initialize animated tile runtime (safe no-op if no animated groups)
    call ${initAnimatedTilesCall}

${analysis.entities && analysis.entities.length > 0 ? `    ; Initialize game entities with real positions from JSON
    call ${initEntitiesCall}
` : `    ; No entities to initialize
`}
${analysis.screenMaps && analysis.screenMaps.length > 0 ? `    ; Load the first game screen
    call load_game_screen
    call rebuild_used_entity_list
` : `    ; No screens - skip screen loading
`}
${needsFont ? `    ; Initialize font system
    call ${initFontCall}
` : `    ; No text/menus - skip font initialization
`}${hasHud ? `    ; HUD dirty flag - will be rendered after screen loading (by GameFlow WorldLink)
    ld a, 1
    ld (hud_dirty_flag), a
` : ``}    call ENASCR               ; Re-enable screen after VRAM updates
    ret

load_game_screen:
    ret

${!needsFont ? `init_font_system:
    ret

reload_font_system:
    ret

` : ''}; --- End of Bank 0 — pad to 8KB boundary ---
    ds #6000 - $, #FF

${primaryBanks.map(bank => {
    const orgHex = bank.orgAddress.toString(16).toUpperCase().padStart(4, '0');
    const endHex = bank.endAddress.toString(16).toUpperCase().padStart(4, '0');
    const moduleList = bank.modules.map(m => m.key).join(', ') || '(empty)';
    const moduleContents = bank.modules.map(m => {
        switch (m.key) {
            case 'components': return emittedFiles['components.asm'];
            case 'sprites': return emittedFiles['sprites.asm'];
            case 'animtiles': return emittedFiles['animtiles.asm'];
            case 'scroll': return emittedFiles['scroll.asm'];
            case 'patterns_code': return emittedFiles['patterns.asm'];
            case 'colors_code': return emittedFiles['colors.asm'];
            case 'screens_code': return emittedFiles['screens.asm'];
            case 'gameflow': return emittedFiles['gameflow.asm'];
            case 'worlds': return emittedFiles['worlds.asm'];
            case 'entities': return emittedFiles['entities.asm'];
            case 'statemachine': return emittedFiles['statemachine.asm'];
            case 'font': return emittedFiles['font.asm'];
            case 'menus': return emittedFiles['menus.asm'];
            case 'hud': return emittedFiles['hud.asm'];
            case 'sound': return emittedFiles['sound.asm'];
            default: return m.content;
        }
    }).join('\n\n');
    return `; ##################################################################
; BANK ${bank.physicalBank} — [#${orgHex}h-#${endHex}h] PRIMARY: ${moduleList}
; (Always mapped at boot: bank1→P1, bank2→P2, bank3→P3)
; ##################################################################
    org #${orgHex}

${moduleContents || '; (empty bank)'}

; --- End of Bank ${bank.physicalBank} — pad to 8KB boundary ---
    ds #${endHex} - $, #FF`;
}).join('\n\n')}

${farCodeBanks.length > 0 ? `${farCodeBanks.map(bank => {
    const orgHex = bank.orgAddress.toString(16).toUpperCase().padStart(4, '0');
    const endHex = bank.endAddress.toString(16).toUpperCase().padStart(4, '0');
    const moduleList = bank.modules.map(m => m.key).join(', ') || '(empty)';
    const moduleContents = bank.modules.map(m => {
        switch (m.key) {
            case 'components': return emittedFiles['components.asm'];
            case 'sprites': return emittedFiles['sprites.asm'];
            case 'animtiles': return emittedFiles['animtiles.asm'];
            case 'scroll': return emittedFiles['scroll.asm'];
            case 'patterns_code': return emittedFiles['patterns.asm'];
            case 'colors_code': return emittedFiles['colors.asm'];
            case 'screens_code': return emittedFiles['screens.asm'];
            case 'gameflow': return emittedFiles['gameflow.asm'];
            case 'worlds': return emittedFiles['worlds.asm'];
            case 'entities': return emittedFiles['entities.asm'];
            case 'statemachine': return emittedFiles['statemachine.asm'];
            case 'font': return emittedFiles['font.asm'];
            case 'menus': return emittedFiles['menus.asm'];
            case 'hud': return emittedFiles['hud.asm'];
            case 'sound': return emittedFiles['sound.asm'];
            default: return m.content;
        }
    }).join('\n\n');
    return `; ##################################################################
; FAR BANK ${bank.physicalBank} — [#${orgHex}h-#${endHex}h] FAR CODE: ${moduleList}
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P${bank.windowPage}, maps bank${bank.physicalBank} to P${bank.windowPage},
; calls routine, then restores P${bank.windowPage}.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_${bank.physicalBank}_ROM_START:
    org #${orgHex}

${moduleContents || '; (empty far bank)'}

; --- End of Far Bank ${bank.physicalBank} — pad to 8KB boundary ---
    ds #${endHex} - $, #FF
    org FAR_BANK_${bank.physicalBank}_ROM_START + #2000`;
}).join('\n\n')}` : ''}

${overflowDataSection}
    end                 ; End of assembly
`;
}
