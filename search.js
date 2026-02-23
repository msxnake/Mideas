const fs = require('fs');
const lines = fs.readFileSync('temp_unitedFiles.asm', 'utf8').split('\n');
lines.forEach((line, i) => {
    if (line.toLowerCase().includes('dead') || line.toLowerCase().includes('anim')) {
        console.log(`${i + 1}: ${line.trim()}`);
    }
});
