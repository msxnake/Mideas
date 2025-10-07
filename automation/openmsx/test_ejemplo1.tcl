# OpenMSX Automation Script for ejemplo1.rom
# Waits 4 seconds, captures screenshot, and exits

puts "=== OpenMSX Automation Started ==="
puts "ROM loaded: ejemplo1.rom"
puts "Waiting 4 seconds for ROM initialization..."

# Wait 4 seconds for ROM to fully initialize
after 4000 {
    puts "Taking screenshot..."
    set screenshot_path "C:/Users/salam/Documents/Programacion/Mideas/screenshots/ejemplo1_rom_test.png"

    # Capture screenshot
    screenshot $screenshot_path
    puts "Screenshot saved to: $screenshot_path"

    # Wait 1 second and exit
    after 1000 {
        puts "Exiting OpenMSX..."
        exit
    }
}

puts "Script ready. Waiting for execution..."
