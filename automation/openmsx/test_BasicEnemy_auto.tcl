# OpenMSX Automation: BasicEnemy FASE4 Test
# Auto-loads ROM, waits, captures screenshot, exits

puts "========================================="
puts "BasicEnemy FASE4 ROM Test - Automated"
puts "========================================="

# Load ROM
carta "c:/Users/salam/Documents/Programacion/Mideas/server/temp/BasicEnemy.rom"
puts "ROM loaded successfully"

# Wait 4 seconds for initialization
puts "Waiting 4 seconds for ROM initialization..."
after 4000 {
    # Generate timestamp
    set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]

    # Screenshot filename
    set screenshot_file "BasicEnemy_FASE4_test_${timestamp}"

    puts "Capturing screenshot: ${screenshot_file}.png"
    screenshot $screenshot_file

    puts "Screenshot saved to OpenMSX screenshots directory"
    puts "Typical location: C:/Users/salam/Documents/openMSX/screenshots/"
    puts ""
    puts "Closing OpenMSX in 2 seconds..."

    after 2000 {
        exit
    }
}
