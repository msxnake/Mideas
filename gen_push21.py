import sys
sys.path.insert(0, '.')
import json
from utils.msxGenerator.index import generateModularASMFromSummary

with open('downloads/push_example21.json', 'r') as f:
    project = json.load(f)

config = {
    'screenMode': 'SCREEN 4 (Graphics II)',
    'romMode': 'simple32k',
    'targetFormat': 'konami',
    'autoMegaROM': False
}

result = generateModularASMFromSummary(project, config)

# Save the generated ASM
with open('test/push_example21.asm', 'w') as f:
    f.write(result['unitedFiles.asm'])

print('ASM generated successfully')
print('Length:', len(result['unitedFiles.asm']), 'chars')