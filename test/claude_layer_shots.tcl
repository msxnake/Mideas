# Four frames of the same enemy, so the split is visible instead of tabulated.
# MIDEAS_SHOT_PREFIX names the files, so the same script serves the before and
# the after build without either overwriting the other.

set PREFIX [lindex $::env(MIDEAS_SHOT_PREFIX) 0]
set OUTDIR "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual"
set n 0

proc shot {} {
    incr ::n
    screenshot -raw [format "%s/%s_shot_%02d.png" $::OUTDIR $::PREFIX $::n]
    if {$::n >= 4} { exit }
    after time 2.0 shot
}

after time 8.0 shot
after time 40.0 { exit }
