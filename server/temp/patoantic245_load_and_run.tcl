set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic245_unified.rom"
set outdir "C:/Users/salam/Documents/Programacion/Mideas/server/temp"

proc shot {name} {
    global outdir
    set path [file join $outdir $name]
    catch {file delete -force $path}
    screenshot $path
    puts "SHOT $path"
}

if {![file exists $rom_path]} {
    puts "ROM_MISSING $rom_path"
    exit
}

carta $rom_path
after 5000
shot "patoantic245_idle.png"

keymatrixdown RIGHT
after 2400
shot "patoantic245_right_hold.png"

keymatrixup RIGHT
after 1400
shot "patoantic245_after_release.png"

after 300
exit
