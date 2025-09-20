# OpenMSX TCL Automation Script
# BasicEnemy ROM GameFlow Test
# Purpose: Verify GameFlow control and paridad with Play mode

puts "=== BasicEnemy ROM GameFlow Test ==="
puts "Loading ROM: BasicEnemy.rom"
puts "Test objectives:"
puts "1. Verify direct game start (no menu - GameFlow control)"
puts "2. Check sprite rendering (bot1 with animation)"
puts "3. Verify screen layout (pantalla1 with brick1 tiles)"
puts "4. Confirm Screen 2 graphics mode"
puts ""

# Load the BasicEnemy ROM
set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/BasicEnemy.rom"
carta $rom_path

puts "ROM loaded, waiting for initialization..."

# Wait 3 seconds for initial ROM loading
after 3000

puts "ROM initialized, waiting for GameFlow execution..."

# Wait 7 more seconds for GameFlow to execute and reach stable game state
# This should give enough time for:
# - Start Node execution
# - WorldLink Node transition
# - Game screen rendering
# - Sprite initialization
after 7000

puts "Capturing screenshot..."

# Capture screenshot with timestamp
set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]
set screenshot_path "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/BasicEnemy_GameFlow_Test_$timestamp.png"
screenshot $screenshot_path

puts "Screenshot saved: $screenshot_path"
puts ""
puts "=== Test Completed ==="
puts "Expected results:"
puts "- Direct game screen (no menu) = GameFlow working"
puts "- bot1 sprite visible with animation"
puts "- pantalla1 screen with brick1 tiles"
puts "- Screen 2 graphics mode active"
puts ""
puts "Please verify screenshot matches Play mode behavior"

# Wait 2 more seconds to ensure screenshot is saved
after 2000

# Exit OpenMSX
exit