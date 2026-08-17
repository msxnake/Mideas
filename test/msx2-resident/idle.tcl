set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-resident"
set f [open "$dir/_idle.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc sample {t} { L "t=$t PC=[format %04X [reg pc]] SP=[format %04X [reg sp]]" }
foreach t {8 12 16 20 25 30 35 40} { after time $t [list sample $t] }
after time 41 { catch {screenshot -raw "$dir/_idle.png"}; close $f; exit }
