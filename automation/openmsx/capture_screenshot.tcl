# OpenMSX Screenshot Automation Script
# Wait 3 seconds and capture screenshot

puts "Screenshot automation started..."
puts "Waiting 3 seconds before capturing..."

after 4000 {
    set screenshot_path "C:/Users/salam/Documents/Programacion/Mideas/screenshots/ejemplo1_rom_test.png"
    puts "Capturing screenshot to: $screenshot_path"
    screenshot $screenshot_path
    puts "Screenshot captured successfully!"
    after 1000 {
        exit
    }
}
