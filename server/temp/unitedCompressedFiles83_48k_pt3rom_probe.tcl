set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/unitedCompressedFiles83_48k_pt3rom_linear48k.rom"
set __out "C:/Users/salam/Documents/Programacion/Mideas/server/temp/unitedCompressedFiles83_48k_pt3rom_probe.png"
set __done 0

if {[catch {carta $__rom} err]} {
    puts "LOAD ERROR: $err"
    set __done 1
}

after time 5000 { keymatrixdown DOWN }
after time 5120 { keymatrixup DOWN }
after time 6200 { keymatrixdown SPACE }
after time 6320 { keymatrixup SPACE }
after time 14000 {
    if {[catch {screenshot $__out} err]} {
        puts "SCREENSHOT ERROR: $err"
    } else {
        puts "SCREENSHOT OK: $__out"
    }
    set __done 1
}

vwait __done
