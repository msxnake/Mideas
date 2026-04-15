puts "Booting patoantic231_unified.rom..."
after 8000 {
    set screenshot_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic231_openmsx_boot.png"
    puts "Capturing $screenshot_path"
    screenshot $screenshot_path
    puts "Done"
    exit
}
vwait forever
