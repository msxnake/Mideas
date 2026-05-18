set shot_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic235_48k_reference.png"
proc tap_space {} { keymatrixdown 8 1; after time 0.22 { keymatrixup 8 1 } }
after time 7.0 { tap_space }
after time 12.0 { tap_space }
after time 13.8 { screenshot $shot_path; exit }
