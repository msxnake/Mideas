# Simple OpenMSX Screenshot Capture for BasicEnemy
puts "Loading BasicEnemy.rom..."

# Load ROM
carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/BasicEnemy.rom"
puts "ROM loaded"

# Reset and wait
reset
puts "System reset, waiting for execution..."
after 8000

# Wait a bit more for stability
after 2000

# Capture screenshot
set timestamp [expr {int([clock seconds])}]
set screenshot_path "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/BasicEnemy_test_$timestamp.png"

puts "Capturing screenshot: $screenshot_path"
screenshot $screenshot_path
puts "Screenshot captured successfully"

# Exit OpenMSX
exit