const fs = require('fs');

const content = fs.readFileSync('server/temp/test_hybrid_generated.asm', 'utf-8');
const lines = content.split('\n');

const routines = ['FAST_LDIRVM:', 'FAST_WRTVRM:', 'FAST_WRTVDP:'];

routines.forEach(routine => {
  console.log(`\nSearching for: ${routine}`);
  let count = 0;
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    // Only count actual label definitions (not comments)
    if (trimmed === routine || (trimmed.startsWith(routine) && !line.trim().startsWith(';'))) {
      count++;
      console.log(`  #${count} at line ${i+1}: ${line.substring(0, 60)}`);
    }
  });
  console.log(`  Total: ${count}`);
  if (count > 1) {
    console.log(`  ❌ DUPLICATE FOUND!`);
  }
});
