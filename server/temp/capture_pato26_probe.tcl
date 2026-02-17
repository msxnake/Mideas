puts "SCRIPT_START"
after 10000 {
    puts "TRY_SCREENSHOT"
    if {[catch {screenshot} e]} {
        puts "SCREENSHOT_ERR:"
    } else {
        puts "SCREENSHOT_OK"
    }
    after 1000 {
        puts "SCRIPT_EXIT"
        exit
    }
}
