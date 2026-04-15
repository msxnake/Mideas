puts "Loading patoantic246 test ROM..."

carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic246_screen_cache_verify_test.rom"

puts "Waiting for ROM initialization..."
after 8000 {
    puts "Capturing screenshot..."
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/patoantic246_test_capture.png"
    puts "Screenshot captured"
    after 1000 {
        puts "Test completed"
        exit
    }
}
