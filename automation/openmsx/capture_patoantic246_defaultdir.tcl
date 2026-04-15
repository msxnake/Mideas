puts "capture_patoantic246_defaultdir.tcl loaded"

after 10000 {
    puts "taking screenshot"
    screenshot patoantic246_screen_cache_verify_test_default.png
    after 1000 {
        puts "exiting openmsx"
        exit
    }
}
