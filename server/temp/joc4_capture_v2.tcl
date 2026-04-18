puts "joc4 capture script start"
set screenshot_path {C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc4_openmsx_v2.png}
after 10000 {
    puts "capturing:$screenshot_path"
    if {[catch {screenshot $screenshot_path} err]} {
        puts "screenshot_error:$err"
        if {[catch {savescreen $screenshot_path} err2]} {
            puts "savescreen_error:$err2"
        } else {
            puts "savescreen_ok:$screenshot_path"
        }
    } else {
        puts "screenshot_ok:$screenshot_path"
    }
    after 2000 exit
}