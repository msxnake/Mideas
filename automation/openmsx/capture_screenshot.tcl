# Simple screenshot capture script for OpenMSX
# Usage: Run after ROM is loaded and running

set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]
set screenshot_name "BasicEnemy_FASE4_test_${timestamp}.png"

# Save to current OpenMSX screenshot directory (default: openMSX user directory)
screenshot $screenshot_name

puts ""
puts "========================================="
puts "Screenshot captured: ${screenshot_name}"
puts "Location: OpenMSX screenshots directory"
puts "========================================="
puts ""
