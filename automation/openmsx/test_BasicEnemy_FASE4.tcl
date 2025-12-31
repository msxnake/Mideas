# OpenMSX Automation Script for BasicEnemy ROM Testing
# Loads ROM, waits 3.5 seconds, captures screenshot, and exits

# Get timestamp for unique filename
set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]

# Set screenshot path
set screenshot_dir "c:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots"
set screenshot_path "${screenshot_dir}/BasicEnemy_FASE4_test_${timestamp}.png"

puts "========================================="
puts "OpenMSX Automation: BasicEnemy FASE4 Test"
puts "========================================="
puts "Loading ROM: BasicEnemy.rom"
puts "Screenshot will be saved to: ${screenshot_path}"
puts ""

# Load the ROM in cartridge slot
carta "c:/Users/salam/Documents/Programacion/Mideas/server/temp/BasicEnemy.rom"

puts "ROM loaded. Waiting 3.5 seconds for initialization..."

# Wait 3.5 seconds (3500 milliseconds) for ROM to initialize and execute
after 3500 {
    puts "Capturing screenshot..."
    screenshot $screenshot_path
    puts "Screenshot saved: ${screenshot_path}"
    puts ""
    puts "Test completed successfully!"
    puts "Closing OpenMSX in 1 second..."
    after 1000 {
        exit
    }
}
