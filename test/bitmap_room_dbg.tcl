proc rd {a} { return [debug read memory $a] }
set ::log {}
proc note {m} { lappend ::log $m }
after time 10 {
    note "boot x=[rd 0xC001] snsmat=[rd 0xC008] mask=[rd 0xC009]"
    keymatrixdown 8 0x80 ;# RIGHT (bit7)
    after time 0.3 { note "r0.3 x=[rd 0xC001] snsmat=[rd 0xC008] mask=[rd 0xC009]"
      after time 0.3 { note "r0.6 x=[rd 0xC001] snsmat=[rd 0xC008] mask=[rd 0xC009]"
        after time 0.6 { note "r1.2 x=[rd 0xC001]"
          keymatrixup 8 0x80
          set fh [open $::env(OUT) w]
          foreach l $::log { puts $fh $l }
          close $fh
          exit
        }
      }
    }
}
