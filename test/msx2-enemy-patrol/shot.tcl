after time 6 {
    keymatrixdown 8 1
    after time 0.6 {
        keymatrixup 8 1
        after time 4 {
            screenshot anim_a.png
            after time 1.2 {
                screenshot anim_b.png
                after time 1.2 {
                    screenshot anim_c.png
                    exit
                }
            }
        }
    }
}
