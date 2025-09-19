# OpenMSX automation script for BasicEnemy ROM testing
# This script loads the ROM, waits for execution, and captures a screenshot

proc test_basicenemy_rom {} {
    set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/BasicEnemy.rom"
    set screenshot_dir "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots"

    # Check if ROM file exists
    if {![file exists $rom_path]} {
        puts "ERROR: ROM file not found at $rom_path"
        return
    }

    # Create screenshots directory if it doesn't exist
    file mkdir $screenshot_dir

    puts "Loading BasicEnemy ROM..."

    # Reset the MSX to ensure clean state
    reset

    # Wait a moment for reset to complete
    after 1000

    # Load the ROM file
    cart $rom_path

    puts "ROM loaded. Starting execution..."

    # Wait 10 seconds for the program to execute and display results
    after 10000

    # Generate timestamp for unique filename
    set timestamp [clock format [clock seconds] -format "%m%d%Y_%H%M%S"]
    set screenshot_file "$screenshot_dir/BasicEnemy_test_$timestamp.png"

    # Capture screenshot
    screenshot $screenshot_file

    puts "Screenshot captured: $screenshot_file"
    puts "BasicEnemy ROM test completed."

    return $screenshot_file
}

# Auto-execute the test
puts "Starting BasicEnemy ROM automation test..."
test_basicenemy_rom