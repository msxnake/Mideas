set probe_mode "megarom_ecs"
set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_megarom_ecs.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { if {[catch {debug read memory $addr} value]} { return -1 }; return $value }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; if {$lo < 0 || $hi < 0} { return -1 }; return [expr {$lo | ($hi << 8)}] }

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set banks [format "%02X/%02X/%02X" [mem8 0xC11B] [mem8 0xC11C] [mem8 0xC11D]]
    set flow [mem8 0xC104]
    set screen [mem8 0xDFA4]
    set active_count [mem8 0xE523]
    set input_count [mem8 0xE546]
    set render_count [mem8 0xE567]
    set active0 [mem8 0xE503]
    set hero [mem8 0xE524]
    set prun [mem8 0xDFB2]
    set pidx [mem8 0xDFB3]
    set px [mem16 0xDFAE]
    set py [mem16 0xDFB0]
    set e0act [mem8 0xD77B]
    set e0ply [mem8 0xD79B]
    set e0x [mem8 0xD95B]
    set e0y [mem8 0xD97B]
    set e0mask [mem8 0xD9DB]
    set e0maskhi [mem8 0xD9FB]
    set e0screen [mem8 0xDA1B]
    set bg0 [mem8 0xC457]
    set bg160 [mem8 0xC4F7]
    set bg704 [mem8 0xC717]
    logline [format "%s pc=%04X sp=%04X banks=%s flow=%02X screen=%02X list=%02X/%02X/%02X active0=%02X hero=%02X prun=%02X pidx=%02X player=%d,%d e0 act=%02X ply=%02X xy=%02X,%02X mask=%02X/%02X scr=%02X bg=%02X,%02X,%02X" $tag $pc $sp $banks $flow $screen $active_count $input_count $render_count $active0 $hero $prun $pidx $px $py $e0act $e0ply $e0x $e0y $e0mask $e0maskhi $e0screen $bg0 $bg160 $bg704]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state ${tag}_before; down 1; after time 0.20 [list state ${tag}_held]; after time 0.28 [list up 1]; after time 0.35 [list state ${tag}_after] }
proc hold_right {tag} { state ${tag}_before; down 128; after time 0.70 [list state ${tag}_held]; after time 0.90 [list up 128]; after time 1.05 [list state ${tag}_after] }
proc shot {name tag} { global shot_dir probe_mode; state $tag; set path "$shot_dir/${probe_mode}_${name}.png"; if {[catch {screenshot $path} err]} { logline "SHOTERR $path $err" } else { logline "SHOTOK $path" } }

after time 2.0  { state "boot" }
after time 7.0  { tap_space "space1" }
after time 8.0  { state "after_space1" }
after time 12.0 { tap_space "space2" }
after time 13.2 { shot "after_space2" "after_space2" }
after time 14.0 { hold_right "right" }
after time 15.3 { shot "after_right" "after_right" }
after time 17.0 { state "final"; close $f; exit }
