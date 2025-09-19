# OpenMSX Automation Script - ROM Test Execution
# This script loads a ROM file, waits for initialization, and captures a screenshot

set rom_path [lindex $argv 0]
if {$rom_path eq ""} {
    puts "Error: No ROM path provided"
    exit 1
}

puts "Starting OpenMSX ROM test automation..."
puts "ROM file: $rom_path"

# Verify ROM file exists
if {![file exists $rom_path]} {
    puts "Error: ROM file not found: $rom_path"
    exit 1
}

# Load the ROM cartridge
puts "Loading ROM cartridge..."
carta $rom_path

# Wait for ROM initialization (5 seconds)
puts "Waiting for ROM initialization..."
after 5000

# Create screenshot directory if it doesn't exist
set screenshot_dir "automation/openmsx/screenshots"
file mkdir $screenshot_dir

# Generate timestamp for unique filename
set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]
set rom_name [file tail [file rootname $rom_path]]
set screenshot_path "$screenshot_dir/${rom_name}_${timestamp}.png"

# Capture screenshot
puts "Capturing screenshot: $screenshot_path"
screenshot $screenshot_path

# Wait a bit more to ensure ROM is fully running (additional 3 seconds)
puts "Waiting for ROM execution stabilization..."
after 3000

# Capture a second screenshot to show running state
set screenshot_path2 "$screenshot_dir/${rom_name}_${timestamp}_running.png"
puts "Capturing running state screenshot: $screenshot_path2"
screenshot $screenshot_path2

puts "ROM test completed successfully!"
puts "Screenshots saved:"
puts "  Initial: $screenshot_path"
puts "  Running: $screenshot_path2"

# Exit OpenMSX
exit