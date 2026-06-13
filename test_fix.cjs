const fs = require('fs');
const path = require('path');
const { generateModularASM } = require('C:/temp/mideas_tsbuild/utils/msxGenerator/index');

const project = JSON.parse(fs.readFileSync('./downloads/push_example21.json', 'utf8'));

const config = {
    'screenMode': 'SCREEN 4 (Graphics II)',
    'romMode': 'simple32k',
    'targetFormat': 'konami',
    'autoMegaROM': false
};

const projectName = 'push_example21';
const assets = project.assets || [];

const result = generateModularASM(projectName, assets, config);

// Check interrupt.asm for coyote/jump buffer code
const interrupt = result['interrupt.asm'] || '';

// Search for coyote/buffer related labels
const coyoteKeywords = ['platform_coyote', 'player_coyote_timer', 'player_jump_buffer_timer', 'coyote', 'jump_buffer'];
let found = false;
for (const kw of coyoteKeywords) {
    const regex = new RegExp(kw, 'i');
    const match = interrupt.match(regex);
    if (match) {
        console.log('FOUND:', kw);
        found = true;
        const idx = interrupt.indexOf(match[0]);
        const start = Math.max(0, idx - 100);
        const end = Math.min(interrupt.length, idx + 200);
        console.log(interrupt.substring(start, end));
        console.log('---');
    }
}

if (!found) {
    console.log('SUCCESS: No coyote/jump buffer code found in interrupt.asm (as expected for legacy project)');
}

// Check for physics constants in the generated ASM
// Look for jump impulse, gravity, terminal velocity constants
const physicsKeywords = ['jumpImpulse', 'gravityStrength', 'terminalVelocity', 'FC00', '0040', '0400', 'FA00', '0080', '0600', '#FC00', '#0040', '#0400', '#FA00', '#0080', '#0600'];
console.log('\n=== Physics constants in interrupt.asm ===');
for (const kw of physicsKeywords) {
    const regex = new RegExp(kw.replace('#', '\\#'), 'i');
    const match = interrupt.match(regex);
    if (match) {
        console.log('FOUND:', kw);
        const idx = interrupt.indexOf(match[0]);
        const start = Math.max(0, idx - 80);
        const end = Math.min(interrupt.length, idx + 80);
        console.log(interrupt.substring(start, end));
        console.log('---');
    }
}

// Also check all files for physics constants
console.log('\n=== Physics constants in ALL files ===');
for (const [name, content] of Object.entries(result)) {
    for (const kw of physicsKeywords) {
        const regex = new RegExp(kw.replace('#', '\\#'), 'i');
        if (regex.test(content)) {
            console.log(`FOUND ${kw} in ${name}`);
            // Show context
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                    const start = Math.max(0, i - 2);
                    const end = Math.min(lines.length, i + 3);
                    console.log(lines.slice(start, end).join('\n'));
                    console.log('---');
                    break;
                }
            }
        }
    }
}

// Print the main.asm (unitedFiles) vertical physics section
const mainAsm = result['main.asm'] || result['unitedFiles.asm'] || '';
console.log('\n=== main.asm / unitedFiles.asm (searching for platform vertical physics) ===');
const mainLines = mainAsm.split('\n');
let inPhysics = false;
let physicsStart = -1;
for (let i = 0; i < mainLines.length; i++) {
    const line = mainLines[i];
    if (line.includes('platform vertical physics') || line.includes('MSX2 platform vertical physics') || line.includes('msx2_apply_platform_gravity') || line.includes('jumpImpulse') || line.includes('gravityStrength') || line.includes('update_hardware_sprite_vertical')) {
        if (physicsStart === -1) physicsStart = Math.max(0, i - 5);
        inPhysics = true;
    }
    if (inPhysics) {
        console.log(`${i}: ${line}`);
        if (line.includes('upload_hardware_sprite_attrs') && i > physicsStart + 10) {
            // Print a bit more then stop
            if (i + 5 < mainLines.length) {
                for (let j = i + 1; j < Math.min(i + 15, mainLines.length); j++) {
                    console.log(`${j}: ${mainLines[j]}`);
                }
            }
            break;
        }
    }
}

// Also search for the jump impulse constant (FC00 or FA00)
console.log('\n=== Searching for jump impulse (FC00/FA00) in main.asm ===');
for (let i = 0; i < mainLines.length; i++) {
    if (mainLines[i].includes('FC00') || mainLines[i].includes('FA00') || mainLines[i].includes('fc00') || mainLines[i].includes('fa00')) {
        console.log(`${i}: ${mainLines[i]}`);
    }
}

// Search for gravity strength (0040 or 0080)
console.log('\n=== Searching for gravity strength (0040/0080) in main.asm ===');
for (let i = 0; i < mainLines.length; i++) {
    if (mainLines[i].includes('0040') || mainLines[i].includes('0080') || mainLines[i].includes('#0040') || mainLines[i].includes('#0080')) {
        console.log(`${i}: ${mainLines[i]}`);
    }
}

// Print lines around update_hardware_sprite_vertical
console.log('\n=== Lines around update_hardware_sprite_vertical ===');
for (let i = 0; i < mainLines.length; i++) {
    if (mainLines[i].includes('update_hardware_sprite_vertical:')) {
        console.log(`Found at line ${i}:`);
        for (let j = Math.max(0, i - 5); j < Math.min(mainLines.length, i + 100); j++) {
            console.log(`${j}: ${mainLines[j]}`);
            if (mainLines[j].includes('upload_hardware_sprite_attrs') && j > i + 10) {
                break;
            }
        }
        break;
    }
}