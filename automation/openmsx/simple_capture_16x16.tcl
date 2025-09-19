# Simple OpenMSX Screenshot Capture for BasicEnemy 16x16
puts "Loading BasicEnemy_16x16.rom..."

# Load ROM
carta "C:/Users/salam/Documents/Programacion/Mideas/server/BasicEnemy_16x16.rom"
puts "ROM loaded"

# Reset and wait
reset
puts "System reset, waiting for execution..."
after 8000

# Check VDP R1 register
set vdp_r1 [debug read "VDP regs" 1]
puts "VDP R1 register: [format 0x%02X $vdp_r1]"

if {($vdp_r1 & 0x02) != 0} {
    puts "SUCCESS: 16x16 sprites are ENABLED"
} else {
    puts "WARNING: 16x16 sprites are DISABLED"
}

# Wait a bit more
after 2000

# Capture screenshot
set timestamp [expr {int([clock seconds])}]
set screenshot_path "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/BasicEnemy_16x16_test_$timestamp.png"

puts "Capturing screenshot: $screenshot_path"
screenshot $screenshot_path
puts "Screenshot captured successfully"

# Exit OpenMSX
exit