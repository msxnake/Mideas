# ZCode verification of the integrated horizontal/vertical laser assets.
# Captures the growing-laser pulse window for both bosses from the freshly
# rebuilt ROM; screenshots land in server/temp with zv_series names.
set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_dualboss_zcode_verify.rom"
carta $rom_path

set n 0
set t 5.4
while {$t < 8.5} {
    set shot [format "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_zv_series_%02d.png" $n]
    after time $t [list screenshot $shot]
    set n [expr {$n + 1}]
    set t [expr {$t + 0.3}]
}
after time 8.6 { exit }
