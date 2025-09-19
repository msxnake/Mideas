# Auto-capture script for BasicEnemy ROM
# This script loads the ROM, waits, captures screenshot and exits

set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/BasicEnemy.rom"
set screenshot_dir "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots"

# Create screenshots directory if it doesn't exist
file mkdir $screenshot_dir

puts "Loading BasicEnemy ROM for automated test..."

# Reset the MSX
reset
after 2000

# Load the ROM
cart $rom_path
puts "BasicEnemy ROM loaded successfully"

# Wait for program execution
puts "Waiting 8 seconds for program execution..."
after 8000

# Generate timestamp for filename
set timestamp [clock format [clock seconds] -format "%m%d%y_%H%M%S"]
set screenshot_file "$screenshot_dir/BasicEnemy_auto_$timestamp.png"

# Capture screenshot
screenshot $screenshot_file
puts "Screenshot captured: $screenshot_file"

# Exit OpenMSX after brief delay
after 2000
exit