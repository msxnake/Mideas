# collector_gems SCREEN 5 bitmap smoke:
#  - boot, press SPACE to skip the intro presentation
#  - gem 0 sits on the player spawn cell -> auto-collected on the first frames
#  - gem 1 sits far away -> must stay uncollected and drawn
# RAM (from gems.asm equates):
#  #C0EF = bitmap_gem_flags+0 (gem_auto)  #C0F0 = bitmap_gem_flags+1 (gem_far)
#  #C0E0 = hud_linked_1_value (collectibles counter, initial 0)
set result_path "test/msx2-gems/gems_result.txt"

proc report {} {
    global result_path
    set f0 [debug read memory 0xC0EF]
    set f1 [debug read memory 0xC0F0]
    set cnt [debug read memory 0xC0E0]
    set fh [open $result_path w]
    puts $fh "gem_auto_flag=$f0"
    puts $fh "gem_far_flag=$f1"
    puts $fh "collectibles_counter=$cnt"
    close $fh
    screenshot -prefix gems_smoke
    after time 1 { exit }
}

# Boot settles, then tap SPACE a few times to skip the intro pages.
after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }
# Game running: give the main loop time to auto-collect gem 0, then report.
after time 16 { report }
