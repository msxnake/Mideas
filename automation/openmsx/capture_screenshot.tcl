# Simple screenshot capture
set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]
set screenshot_path "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/BasicEnemy_GameFlow_$timestamp.png"
screenshot $screenshot_path
puts "Screenshot captured: $screenshot_path"