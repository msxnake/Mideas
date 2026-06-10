proc rd {addr} { return [debug read memory $addr] }
set ::log {}
proc note {msg} { lappend ::log $msg }
after time 5 {
    # face/move left away from the box
    keymatrixdown 8 0x10
    after time 0.6 {
        keymatrixup 8 0x10
        note "x_after_left=[rd 0xC000]"
        # tap right to face right (dx=1)
        keymatrixdown 8 0x80
        after time 0.15 {
            keymatrixup 8 0x80
            note "x_pre_dash=[rd 0xC000] dx=[rd 0xC002]"
            # dash: N key (row 4 bit 3), dash RAM timer at 0xC079
            keymatrixdown 4 0x08
            after time 0.2 {
                note "dash_timer=[rd 0xC079]"
                keymatrixup 4 0x08
                after time 0.4 {
                    note "x_post_dash=[rd 0xC000]"
                    # teleport: save point A with DOWN (row 8 bit 6)
                    keymatrixdown 8 0x40
                    after time 0.2 {
                        keymatrixup 8 0x40
                        note "teleA_x=[rd 0xC000] tele_flags=[rd 0xC080]"
                        after time 1.2 {
                            # walk left ~7 tiles
                            keymatrixdown 8 0x10
                            after time 0.5 {
                                keymatrixup 8 0x10
                                note "x_moved_away=[rd 0xC000]"
                                # teleport back (destination is to the RIGHT: negative delta path)
                                keymatrixdown 8 0x40
                                after time 0.2 {
                                    keymatrixup 8 0x40
                                    after time 0.3 {
                                        note "x_after_teleport=[rd 0xC000] tele_flags=[rd 0xC080]"
                                        set fh [open "test/smoke_skills.txt" w]
                                        foreach l $::log { puts $fh $l }
                                        close $fh
                                        exit
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
