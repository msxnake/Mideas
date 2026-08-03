# Visual proof: get into the room, press B, and shoot a burst of screenshots a
# few frames apart. A bullet travels 4 px/frame, so if the skill works it must
# appear as a small sprite drifting away from the player between shots.
set base "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/fire"

foreach t {9 10 11 12 13 14} {
    after time $t                 "keymatrixdown 8 0x01"
    after time [expr {$t + 0.25}] "keymatrixup 8 0x01"
}

# Reference shot: in the room, nothing fired yet.
after time 16.0 { screenshot -raw ${::base}_00_before.png }

# Tap B and sample the next ~40 frames.
after time 16.5 { keymatrixdown 2 0x80 }
after time 16.7 { keymatrixup   2 0x80 }
after time 16.8 { screenshot -raw ${::base}_01_after.png }
after time 17.0 { screenshot -raw ${::base}_02_after.png }
after time 17.2 { screenshot -raw ${::base}_03_after.png }

# Hold B down for a full second in case a tap is missed.
after time 18.0 { keymatrixdown 2 0x80 }
after time 18.3 { screenshot -raw ${::base}_04_held.png }
after time 18.6 { screenshot -raw ${::base}_05_held.png }
after time 19.0 { keymatrixup 2 0x80 }

after time 20 { after time 1 { exit } }
