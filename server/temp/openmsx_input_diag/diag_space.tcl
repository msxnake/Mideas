set __pre "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_input_diag/pre_space.png"
set __post "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_input_diag/post_space.png"
after time 4500 { screenshot $__pre }
after time 5000 { keymatrixdown SPACE }
after time 5200 { keymatrixup SPACE }
after time 6200 { screenshot $__post }
after time 6400 { exit }
vwait __done
