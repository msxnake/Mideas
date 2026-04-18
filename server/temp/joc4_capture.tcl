set screenshot_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc4_openmsx.png"
after time 6 {
    catch {screenshot $screenshot_path} result
    puts "SCREENSHOT:$screenshot_path"
    after time 1 { exit }
}