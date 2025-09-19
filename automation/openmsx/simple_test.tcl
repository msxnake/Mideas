# Simple OpenMSX ROM test with screenshot
puts "Loading BasicEnemy ROM..."

# Load the ROM
carta "C:\\Users\\salam\\Documents\\Programacion\\Mideas\\server\\BasicEnemy.rom"

# Wait for initialization
after 8000 {
    # Create timestamp
    set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]
    set screenshot_path "automation/openmsx/screenshots/BasicEnemy_test_${timestamp}.png"

    puts "Taking screenshot: $screenshot_path"
    screenshot $screenshot_path

    puts "ROM test completed - screenshot saved!"
    exit
}

# Keep the event loop running
vwait forever