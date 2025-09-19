# OpenMSX automation script for test.rom
# This script loads test.rom, waits for initialization, and captures a screenshot

puts "Loading test.rom in OpenMSX..."
puts "ROM should display a 16x16 sprite at position (120,88) in SCREEN 2 mode"

# Load the ROM file
carta "C:\\Users\\salam\\Documents\\Programacion\\Mideas\\test.rom"

# Wait for ROM initialization and sprite setup (5 seconds)
puts "Waiting for ROM initialization..."
after 5000 {
    puts "Capturing screenshot..."
    screenshot "C:\\Users\\salam\\Documents\\Programacion\\Mideas\\automation\\openmsx\\screenshots\\test_rom_[clock format [clock seconds] -format %Y%m%d_%H%M%S].png"
    puts "Screenshot captured successfully"

    # Wait a moment then exit
    after 1000 {
        puts "Test completed"
        exit
    }
}