set outdir "C:/Users/salam/Documents/Programacion/Mideas/server/temp"

proc shot {name} {
    global outdir
    set path [file join $outdir $name]
    catch {file delete -force $path}
    screenshot $path
    puts "SHOT $path"
}

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
