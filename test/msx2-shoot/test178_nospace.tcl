set base "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/ns"
# No SPACE at all: let the presentation/gameflow run its own course.
after time 20 { screenshot -raw ${::base}_t20.png }
after time 30 { screenshot -raw ${::base}_t30.png }
after time 31 { keymatrixdown 8 0x80 }
after time 33 { screenshot -raw ${::base}_t33_right.png ; keymatrixup 8 0x80 }
after time 34 { after time 1 { exit } }
