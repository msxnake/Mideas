# OpenMSX TCL script to load ROM with symbols
# Usage: openmsx.exe -script load_rom_with_symbols.tcl -romfile game.rom -symfile game.sym

# Get command line arguments
set rom_file [dict get $::argv -romfile]
set sym_file [dict get $::argv -symfile]

puts "Loading ROM: $rom_file"
puts "Loading Symbols: $sym_file"

# Insert the ROM cartridge
carta $rom_file

# Wait a moment for ROM to load
after 100

# Load symbol file for debugging
debug load_symbols $sym_file

puts "Symbols loaded successfully!"
puts "Available commands:"
puts "  debug list_symbols          - List all loaded symbols"
puts "  debug set_bp <symbol>       - Set breakpoint at symbol"
puts "  debug disasm <symbol>       - Disassemble at symbol"
puts "  debug read <symbol>         - Read memory at symbol"

# List loaded symbols
puts "\n=== Loaded Symbols ==="
debug list_symbols
