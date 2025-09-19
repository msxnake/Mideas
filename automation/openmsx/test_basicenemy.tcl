# OpenMSX automation script for BasicEnemy ROM testing
# This script loads the ROM, waits for execution, and captures a screenshot

proc test_basicenemy_rom {} {
    set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/basicenemy_generated.rom"
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
    set screenshot_file "$screenshot_dir/basicenemy_test_$timestamp.png"

    # Capture screenshot
    screenshot $screenshot_file

    puts "Screenshot captured: $screenshot_file"
    puts "BasicEnemy ROM test completed."

    return $screenshot_file
}

# Debug commands for step-by-step analysis
proc setup_debugging {} {
    puts "Setting up debugging environment..."

    # Enable CPU debugger
    debug set_bp 0x0000
    debug list_bp

    puts "Debugging setup complete."
    puts "Available debug commands:"
    puts "  step          - Execute one instruction"
    puts "  step_over     - Step over subroutine calls"
    puts "  step_out      - Step out of current subroutine"
    puts "  debug cont    - Continue execution"
    puts "  debug set_bp <addr> - Set breakpoint at address"
    puts "  debug remove_bp <id> - Remove breakpoint"
    puts "  debug list_bp - List all breakpoints"
    puts "  info register - Show CPU registers"
    puts "  info memory <addr> - Show memory contents"
}

proc quick_debug_session {} {
    puts "Starting quick debug session..."

    # Reset and load ROM
    reset
    after 1000
    cart "C:/Users/salam/Documents/Programacion/Mideas/server/temp/basicenemy_generated.rom"

    # Set initial breakpoint at ROM start (typically 0x4000 for cartridge)
    debug set_bp 0x4000

    puts "ROM loaded with breakpoint at 0x4000"
    puts "Use 'debug cont' to start execution and hit the breakpoint"
    puts "Then use step commands to analyze execution"
}

# Auto-execute the test
puts "Starting BasicEnemy ROM automation test..."
test_basicenemy_rom