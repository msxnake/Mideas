const fs = require('fs');
const content = fs.readFileSync('c:/Users/salam/Downloads/unitedFiles(2).asm');
// Assuming UTF-16LE, convert to UTF8 string
const str = content.toString('utf16le');
if (str.includes('================')) {
    const lines = str.split('\n');
    let smStart = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('statemachine.asm part 1/3') || lines[i].includes('state machine') || lines[i].toLowerCase().includes('anim')) {
            console.log(i + ': ' + lines[i].trim().substring(0, 100));
        }
    }
} else {
    // maybe utf-8
    const str8 = content.toString('utf8');
    const lines = str8.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('statemachine.asm') || lines[i].toLowerCase().includes('dead') || lines[i].toLowerCase().includes('anim')) {
            console.log(i + ': ' + lines[i].trim().substring(0, 100));
        }
    }
}
