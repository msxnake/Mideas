import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the test project
const projectPath = join(__dirname, 'test_start_node.json');
const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));

// Get assets
const gameFlowAsset = projectData.assets.find(a => a.type === 'gameflow');
const globalVarsAsset = projectData.assets.find(a => a.type === 'globalvariables');

const gameFlow = gameFlowAsset.data;
const globalVariables = globalVarsAsset.variables;

// Generate GameFlow ASM code
let code = `; ==================================================================
; GAMEFLOW EXECUTION ENGINE - TEST
; File: test_gameflow.asm
; Description: Testing Start node with initialization
; ==================================================================
;
; GameFlow: ${gameFlow.name}
; Total Nodes: ${gameFlow.nodes.length}
; Start Node: ${gameFlow.startNodeId}
; ==================================================================

; ==================================================================
; GAMEFLOW INITIALIZATION
; ==================================================================

gameflow_init:
    xor a
    ld (gameflow_exit_requested), a
    ret

gameflow_start:
    ld hl, gameflow_node_${gameFlow.startNodeId.replace(/-/g, '_')}
    jp gameflow_execute_node

; ==================================================================
; CORE EXECUTION ENGINE
; ==================================================================

gameflow_execute_node:
    ld a, (hl)
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld c, (hl)
    inc hl
    ld b, (hl)

    ; Dispatch to Start handler (simplified)
    cp 0  ; NODE_TYPE_START
    jp z, gameflow_handle_start
    ret

; ==================================================================
; NODE HANDLERS
; ==================================================================

gameflow_handle_start:
    ; Start node - Initialize game state and systems
    push bc

    ; Execute initialization routine
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)

    ; Call initialization routine
    ld a, d
    or e
    jr z, .skip_init

    push de
    ex de, hl
    ld de, .after_init
    push de
    jp (hl)

.after_init:
    pop de

.skip_init:
    ; Continue to next node (End node in this test)
    pop bc
    ret

; ==================================================================
; INITIALIZATION UTILITY FUNCTIONS
; ==================================================================

init_psg_silence:
    push af
    push bc

    ; Silence channel A
    ld a, #08
    out (#A0), a
    ld a, 0
    out (#A1), a

    ; Silence channel B
    ld a, #09
    out (#A0), a
    ld a, 0
    out (#A1), a

    ; Silence channel C
    ld a, #0A
    out (#A0), a
    ld a, 0
    out (#A1), a

    pop bc
    pop af
    ret

clear_sprite_table:
    push af
    push bc
    push de
    push hl

    ld hl, #1B00
    ld bc, 128
    ld a, #D1
.clear_loop:
    push hl
    ld c, a
    call WRTVRM
    pop hl
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .clear_loop

    pop hl
    pop de
    pop bc
    pop af
    ret

init_all_global_variables:
`;

// Generate initialization for all global variables
if (globalVariables && globalVariables.length > 0) {
  code += `    ; Initialize global variables\n`;
  globalVariables.forEach(v => {
    const asmVarName = v.asmName;
    const initialValue = v.values[0].value;
    code += `    ld a, ${initialValue}\n`;
    code += `    ld (${asmVarName}), a    ; ${v.name} = ${initialValue}\n`;
  });
}

code += `    ret

; ==================================================================
; NODE DATA STRUCTURES
; ==================================================================

`;

// Generate Start node structure
const startNode = gameFlow.nodes.find(n => n.type === 'Start');
const nodeLabel = `gameflow_node_${startNode.id.replace(/-/g, '_')}`;

code += `; Node: Start - Game Initialization
${nodeLabel}:
    db 0                        ; NODE_TYPE_START
    dw ${nodeLabel}_data        ; Data pointer
    dw ${nodeLabel}_conn        ; Connection table

${nodeLabel}_data:
    dw ${nodeLabel}_init        ; Initialization routine address

${nodeLabel}_conn:
    db 0                        ; CONNECTION_DEFAULT
    dw gameflow_node_end_001    ; Next node (End)
    db 255                      ; CONNECTION_END

; ------------------------------------------------------------------
; ${nodeLabel}_init
; Initialization routine for Start node
; ------------------------------------------------------------------
${nodeLabel}_init:
`;

// Generate initialization based on configuration
const initGlobals = startNode.initializeGlobals;
const systemConfig = startNode.systemConfig;

if (systemConfig) {
  code += `    ; === MSX System Initialization ===\n`;

  if (systemConfig.initPSG) {
    code += `    ; Initialize PSG (silence all channels)\n`;
    code += `    call init_psg_silence\n\n`;
  }

  if (systemConfig.clearSprites) {
    code += `    ; Clear sprite attribute table\n`;
    code += `    call clear_sprite_table\n\n`;
  }
}

if (initGlobals && initGlobals.enabled) {
  code += `    ; === Global Variables Initialization ===\n`;

  if (initGlobals.variables && initGlobals.variables.length > 0) {
    initGlobals.variables.forEach(v => {
      const asmVarName = `global_var_${v.variableName}`;
      const value = v.value;
      code += `    ld a, ${value}\n`;
      code += `    ld (${asmVarName}), a    ; ${v.variableName} = ${value}\n`;
    });
  }

  code += `\n`;
}

if (systemConfig && systemConfig.initialDelayFrames > 0) {
  code += `    ; Initial delay\n`;
  code += `    ld b, ${systemConfig.initialDelayFrames}\n`;
  code += `.delay_loop:\n`;
  code += `    halt    ; Wait for V-blank\n`;
  code += `    djnz .delay_loop\n\n`;
}

code += `    ret

; End node (placeholder)
gameflow_node_end_001:
    db 1                        ; NODE_TYPE_END
    dw 0
    dw 0

; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

gameflow_exit_requested:    db 0

; Global game variables
${globalVariables.map(v => `${v.asmName}:    db 0    ; ${v.description}`).join('\n')}

; ==================================================================
; BIOS ROUTINES (placeholders)
; ==================================================================

WRTVRM:
    ret

; ==================================================================
; END OF GAMEFLOW
; ==================================================================
`;

// Write the generated code
const outputPath = join(__dirname, 'server/temp/test_start_gameflow.asm');
fs.writeFileSync(outputPath, code, 'utf-8');

console.log('✅ ASM code generated successfully!');
console.log('📄 Output file:', outputPath);
console.log('\n=== GENERATED CODE SUMMARY ===');
console.log('- Global variables:', globalVariables.length);
console.log('- Start node initialization: ENABLED');
console.log('- System configs:', Object.keys(systemConfig).filter(k => systemConfig[k]).length);
console.log('\n🔍 Key sections in generated ASM:');
console.log('1. gameflow_node_start_001_init - Initialization routine');
console.log('2. init_psg_silence - PSG silence function');
console.log('3. clear_sprite_table - Sprite table clear function');
console.log('4. Global variable initialization code');
console.log('\n📝 Check the file to see the complete implementation!');
