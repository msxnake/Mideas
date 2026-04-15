set __pre "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_input_diag/patoantic237_pre.png"
set __post "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_input_diag/patoantic237_post.png"
after time 4500 { screenshot $__pre }
after time 5000 { keymatrixdown SPACE }
after time 5300 { keymatrixup SPACE }
after time 7000 { screenshot $__post }
after time 7400 { exit }
vwait __done
