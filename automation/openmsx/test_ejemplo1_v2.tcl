# OpenMSX Automation Script for ejemplo1.rom - Version 2
# Uses absolute path and verbose output

puts "=== OpenMSX Automation Started ==="
puts "Current working directory: [pwd]"

# Wait 4 seconds for ROM to fully initialize
after 4000 {
    puts "Attempting screenshot capture..."

    # Try to capture screenshot with absolute Windows path
    set screenshot_file "C:/Users/salam/Documents/Programacion/Mideas/screenshots/ejemplo1_rom_test.png"
    puts "Screenshot path: $screenshot_file"

    if {[catch {screenshot $screenshot_file} result]} {
        puts "ERROR capturing screenshot: $result"
    } else {
        puts "SUCCESS: Screenshot captured to $screenshot_file"
    }

    # Wait 1 second and exit
    after 1000 {
        puts "Exiting OpenMSX..."
        exit
    }
}

puts "Script loaded successfully. Timer started."
