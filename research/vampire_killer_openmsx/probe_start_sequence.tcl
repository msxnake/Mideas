set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_start_sequence.log" "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc state {tag} { logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" $tag [reg PC] [reg SP] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]] }
proc shot {name tag} { global out_dir; state $tag; screenshot "$out_dir/$name"; logline "SHOT $name" }
proc kd {mask label} { keymatrixdown 8 $mask; logline "KD $label $mask" }
proc ku {mask label} { keymatrixup 8 $mask; logline "KU $label $mask" }

logline "RUN start sequence"
after time 8.0 { shot "startseq_08_title.png" "T08" }
after time 9.0 { kd 1 "SPACE1" }
after time 9.2 { ku 1 "SPACE1" }
after time 11.0 { shot "startseq_11_after_space1.png" "T11" }
after time 12.0 { kd 1 "SPACE2" }
after time 12.2 { ku 1 "SPACE2" }
after time 14.0 { shot "startseq_14_after_space2.png" "T14" }
after time 17.0 { shot "startseq_17.png" "T17" }
after time 20.0 { shot "startseq_20.png" "T20" }
after time 22.0 { kd 128 "RIGHT" }
after time 23.0 { ku 128 "RIGHT" }
after time 23.2 { shot "startseq_23_after_right.png" "T23" }
after time 25.0 { shot "startseq_25.png" "T25" }
after time 25.5 { close $::f; exit }
