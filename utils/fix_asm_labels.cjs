/**
 * Fix ASM label naming convention:
 * - UPPERCASE for constants (EQU values)
 * - lowercase for routine labels, variables, jumps
 */

const fs = require('fs');
const path = require('path');

// Labels that should remain UPPERCASE (constants)
const CONSTANTS_REGEX = /^[A-Z_]+\s+(EQU|equ)/;

// Common routine label patterns that should be lowercase
const ROUTINE_LABELS = [
  // Main program flow
  'INIT_ROM', 'MAIN_PROGRAM', 'MAIN_LOOP', 'INIT_GAME_SYSTEMS',
  'UPDATE_CURRENT_STATE', 'RENDER_FRAME', 'LOAD_GAME_SCREEN',

  // Game flow
  'EXECUTE_GAMEFLOW_START', 'EXECUTE_GAMEFLOW_NODE', 'EXECUTE_START_NODE',
  'EXECUTE_WORLD_LINK_NODE', 'EXECUTE_SCREEN_NODE', 'EXECUTE_MENU_NODE',
  'LOAD_DEFAULT_SCREEN', 'FIND_NEXT_GAMEFLOW_NODE', 'LOAD_REFERENCED_SCREEN',
  'SHOW_MENU_INTERFACE', 'SHOW_NO_CONTENT_MESSAGE',

  // Game states
  'GAME_OVER', 'CHECK_GAME_OVER_CONDITIONS', 'PAUSE_GAME', 'RESUME_GAME',
  'CLEAR_PAUSE_OVERLAY', 'HANDLE_PAUSE_INPUT',

  // Sprite functions
  'CLEAR_ALL_SPRITES', 'INIT_SPRITE_DATA', 'UPDATE_SPRITE',

  // Screen functions
  'FILLSCREEN', 'INIT_FONT_SYSTEM',

  // Data sections
  '_DATA', '_PATTERN', '_COLOR', '_SCREEN', '_SPRITE'
];

function fixLabelsInFile(filePath) {
  console.log(`\n📝 Processing: ${path.basename(filePath)}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const modified = [];
  let changesCount = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Skip if it's a constant definition
    if (CONSTANTS_REGEX.test(trimmed)) {
      modified.push(line);
      continue;
    }

    // Check if line contains a routine label (ends with :)
    const labelMatch = trimmed.match(/^([A-Z_]+):/);
    if (labelMatch) {
      const oldLabel = labelMatch[1];
      const newLabel = oldLabel.toLowerCase();

      if (oldLabel !== newLabel) {
        // Replace the label definition
        line = line.replace(`${oldLabel}:`, `${newLabel}:`);
        changesCount++;
        console.log(`  ${oldLabel}: → ${newLabel}:`);
      }
    }

    // Replace CALL/JP/JR references to routine labels
    for (const routineLabel of ROUTINE_LABELS) {
      const regex = new RegExp(`\\b${routineLabel}\\b(?!.*EQU)`, 'g');
      if (regex.test(line)) {
        line = line.replace(regex, routineLabel.toLowerCase());
        changesCount++;
      }
    }

    modified.push(line);
  }

  if (changesCount > 0) {
    fs.writeFileSync(filePath, modified.join('\n'), 'utf-8');
    console.log(`✅ Modified ${changesCount} labels in ${path.basename(filePath)}`);
  } else {
    console.log(`⏭️  No changes needed`);
  }

  return changesCount;
}

// Main
const files = [
  path.join(__dirname, 'msxModularGenerator.ts'),
  path.join(__dirname, 'z80CodeGenerator.ts'),
  path.join(__dirname, 'asmTemplateGenerator.ts'),
  path.join(__dirname, 'stateMachineGenerator.ts')
];

console.log('🔧 Fixing ASM label naming convention...');
console.log('Rule: UPPERCASE=constants, lowercase=routines/variables\n');

let totalChanges = 0;
for (const file of files) {
  if (fs.existsSync(file)) {
    totalChanges += fixLabelsInFile(file);
  } else {
    console.log(`⚠️  File not found: ${path.basename(file)}`);
  }
}

console.log(`\n✅ Done! Total changes: ${totalChanges}`);
