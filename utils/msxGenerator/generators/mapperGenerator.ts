/**
 * @fileoverview Mapper Generator - runtime mapper API and bank switch routines
 * Generates mapper.asm with centralized mapper register writes.
 */

export type MapperFormat = 'konami' | 'ascii8' | 'ascii16';
export type MapperRomMode = 'auto' | 'simple32k' | 'megarom';

export interface MapperRuntimeOptions {
  targetFormat?: MapperFormat;
  romMode?: MapperRomMode;
  autoMegaROM?: boolean;
}

interface MapperRegisterLayout {
  regP1: string;
  regP2: string;
  regP3: string;
  regP4: string;
  notes: string[];
}

function resolveMapperRegisterLayout(format: MapperFormat): MapperRegisterLayout {
  if (format === 'ascii8') {
    return {
      regP1: '#6000',
      regP2: '#6800',
      regP3: '#7000',
      regP4: '#7800',
      notes: [
        '; ASCII8 register mapping (MSX Wiki ROM mappers):',
        ';   4000-5FFF <- 6000h',
        ';   6000-7FFF <- 6800h',
        ';   8000-9FFF <- 7000h',
        ';   A000-BFFF <- 7800h'
      ]
    };
  }

  if (format === 'ascii16') {
    return {
      regP1: '#6000',
      regP2: '#6000',
      regP3: '#7000',
      regP4: '#7000',
      notes: [
        '; ASCII16 register mapping (MSX Wiki ROM mappers):',
        ';   4000-7FFF <- 6000h (P1/P2 share one 16KB register)',
        ';   8000-BFFF <- 7000h (P3/P4 share one 16KB register)'
      ]
    };
  }

  return {
    regP1: '#6000',
    regP2: '#8000',
    regP3: '#A000',
    regP4: '#A000',
    notes: [
      '; Konami (without SCC) write window references:',
      ';   6000h-7FFFh, 8000h-9FFFh, A000h-BFFFh are switch registers.',
      '; Note: in original Konami cartridges 4000h-5FFFh is typically fixed.'
    ]
  };
}

export function generateMapperFile(options: MapperRuntimeOptions = {}): string {
  const targetFormat: MapperFormat = options.targetFormat || 'konami';
  const romMode: MapperRomMode = options.romMode || 'auto';
  const autoMegaROM = options.autoMegaROM ?? true;
  const mapperWritesEnabled = romMode === 'megarom' || (romMode === 'auto' && autoMegaROM);

  if (!mapperWritesEnabled) {
    return `; ==================================================================
; MAPPER RUNTIME API
; File: mapper.asm
; Description: Minimal compatibility stubs for simple32k builds
; Target mapper: ${targetFormat}
; ROM mode: ${romMode} (autoMegaROM=${autoMegaROM ? 'true' : 'false'})
; ==================================================================
;
; This build runs in simple32k mode, so bank switching is not active.
; Keep mapper API labels as no-op stubs so generated gameplay code can
; call the same routines without conditional assembly branches.

; ------------------------------------------------------------------
; mapper_runtime_init
; Initializes runtime mirrors only (no hardware mapper writes).
; ------------------------------------------------------------------
mapper_runtime_init:
    xor a
    ld (mapper_bank_p1_current), a
    ld a, 1
    ld (mapper_bank_p2_current), a
    ld a, 2
    ld (mapper_bank_p3_current), a
    ld a, 3
    ld (mapper_bank_p4_current), a
    ret

; ------------------------------------------------------------------
; API: mapper_set_bank_pX
; Input: A = bank number (stored only for compatibility)
; ------------------------------------------------------------------
mapper_set_bank_p1:
    ld (mapper_bank_p1_current), a
    ret

mapper_set_bank_p2:
    ld (mapper_bank_p2_current), a
    ret

mapper_set_bank_p3:
    ld (mapper_bank_p3_current), a
    ret

mapper_set_bank_p4:
    ld (mapper_bank_p4_current), a
    ret

; ------------------------------------------------------------------
; Save/restore helpers (compatibility only).
; ------------------------------------------------------------------
mapper_push_p1:
    ld a, (mapper_bank_p1_current)
    ld (mapper_saved_bank_p1), a
    ret

mapper_pop_p1:
    ld a, (mapper_saved_bank_p1)
    jp mapper_set_bank_p1

mapper_push_p2:
    ld a, (mapper_bank_p2_current)
    ld (mapper_saved_bank), a
    ret

mapper_pop_p2:
    ld a, (mapper_saved_bank)
    jp mapper_set_bank_p2

mapper_push_p3:
    ld a, (mapper_bank_p3_current)
    ld (mapper_saved_bank_p3), a
    ret

mapper_pop_p3:
    ld a, (mapper_saved_bank_p3)
    jp mapper_set_bank_p3

mapper_push_p4:
    ld a, (mapper_bank_p4_current)
    ld (mapper_saved_bank_p4), a
    ret

mapper_pop_p4:
    ld a, (mapper_saved_bank_p4)
    jp mapper_set_bank_p4

; ------------------------------------------------------------------
; Far call helpers (simple32k no-op bank switch).
; ------------------------------------------------------------------
mapper_call_hl_p1:
    ld de, .return_p1
    push de
    jp (hl)
.return_p1:
    ret

mapper_call_hl_p2:
    jp mapper_call_hl_p1

mapper_call_hl_p3:
    jp mapper_call_hl_p1

mapper_call_hl_p4:
    jp mapper_call_hl_p1

mapper_call_hl_auto:
    jp mapper_call_hl_p1
`;
  }

  const layout = resolveMapperRegisterLayout(targetFormat);
  const writeComment = mapperWritesEnabled
    ? '; Mapper register writes are enabled for this build configuration.'
    : '; Mapper register writes are disabled (simple32k mode).';

  return `; ==================================================================
; MAPPER RUNTIME API
; File: mapper.asm
; Description: Centralized mapper register writes (no scattered inline writes)
; Target mapper: ${targetFormat}
; ROM mode: ${romMode} (autoMegaROM=${autoMegaROM ? 'true' : 'false'})
; ==================================================================

${layout.notes.join('\n')}
${writeComment}

; Mapper registers for active target format
MAPPER_REG_P1       EQU ${layout.regP1}
MAPPER_REG_P2       EQU ${layout.regP2}
MAPPER_REG_P3       EQU ${layout.regP3}
MAPPER_REG_P4       EQU ${layout.regP4}

; ------------------------------------------------------------------
; mapper_runtime_init
; Initializes mapper state variables with deterministic defaults.
; ------------------------------------------------------------------
mapper_runtime_init:
    xor a
    ld (mapper_bank_p1_current), a
    ld a, 1
    ld (mapper_bank_p2_current), a
    ld a, 2
    ld (mapper_bank_p3_current), a
    ld a, 3
    ld (mapper_bank_p4_current), a
    ret

; ------------------------------------------------------------------
; API: mapper_set_bank_pX
; Input: A = bank number
; ------------------------------------------------------------------
mapper_set_bank_p1:
    ld (mapper_bank_p1_current), a
${mapperWritesEnabled ? `    ld (MAPPER_REG_P1), a` : `    ; write disabled in current ROM mode`}
    ret

mapper_set_bank_p2:
    ld (mapper_bank_p2_current), a
${mapperWritesEnabled ? `    ld (MAPPER_REG_P2), a` : `    ; write disabled in current ROM mode`}
    ret

mapper_set_bank_p3:
    ld (mapper_bank_p3_current), a
${mapperWritesEnabled ? `    ld (MAPPER_REG_P3), a` : `    ; write disabled in current ROM mode`}
    ret

mapper_set_bank_p4:
    ld (mapper_bank_p4_current), a
${mapperWritesEnabled ? `    ld (MAPPER_REG_P4), a` : `    ; write disabled in current ROM mode`}
    ret

; ------------------------------------------------------------------
; Helpers for deterministic save/restore around far calls.
; ------------------------------------------------------------------
mapper_push_p1:
    ld a, (mapper_bank_p1_current)
    ld (mapper_saved_bank_p1), a
    ret

mapper_pop_p1:
    ld a, (mapper_saved_bank_p1)
    jp mapper_set_bank_p1

mapper_push_p2:
    ld a, (mapper_bank_p2_current)
    ld (mapper_saved_bank), a
    ret

mapper_pop_p2:
    ld a, (mapper_saved_bank)
    jp mapper_set_bank_p2

mapper_push_p3:
    ld a, (mapper_bank_p3_current)
    ld (mapper_saved_bank_p3), a
    ret

mapper_pop_p3:
    ld a, (mapper_saved_bank_p3)
    jp mapper_set_bank_p3

mapper_push_p4:
    ld a, (mapper_bank_p4_current)
    ld (mapper_saved_bank_p4), a
    ret

mapper_pop_p4:
    ld a, (mapper_saved_bank_p4)
    jp mapper_set_bank_p4

; ------------------------------------------------------------------
; Far call helpers (dynamic target address in HL)
; Input:
;   A = target bank number
;   HL = target routine address in selected page window
; Output:
;   Returns after restoring previous bank.
; ------------------------------------------------------------------
mapper_call_hl_p1:
    push hl
    push af
    call mapper_push_p1
    pop af
    call mapper_set_bank_p1
    pop hl
    ld de, .return_p1
    push de
    jp (hl)
.return_p1:
    call mapper_pop_p1
    ret

mapper_call_hl_p2:
    push hl
    push af
    call mapper_push_p2
    pop af
    call mapper_set_bank_p2
    pop hl
    ld de, .return_p2
    push de
    jp (hl)
.return_p2:
    call mapper_pop_p2
    ret

mapper_call_hl_p3:
    push hl
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    pop hl
    ld de, .return_p3
    push de
    jp (hl)
.return_p3:
    call mapper_pop_p3
    ret

mapper_call_hl_p4:
    push hl
    push af
    call mapper_push_p4
    pop af
    call mapper_set_bank_p4
    pop hl
    ld de, .return_p4
    push de
    jp (hl)
.return_p4:
    call mapper_pop_p4
    ret

; ------------------------------------------------------------------
; mapper_call_hl_auto
; Auto-select mapper window from HL target address range:
;   4000-5FFF -> p1
;   6000-7FFF -> p2
;   8000-9FFF -> p3
;   A000-BFFF -> p4
; Input:
;   A = target bank
;   HL = target routine address
; ------------------------------------------------------------------
mapper_call_hl_auto:
    push af
    ld a, h
    cp #60
    jr c, .use_p1
    cp #80
    jr c, .use_p2
    cp #A0
    jr c, .use_p3
    pop af
    jp mapper_call_hl_p4

.use_p1:
    pop af
    jp mapper_call_hl_p1

.use_p2:
    pop af
    jp mapper_call_hl_p2

.use_p3:
    pop af
    jp mapper_call_hl_p3
`;
}
