set log_path "C:/Users/salam/Documents/Programacion/Mideas/screenshots/box2_debug_push.txt"
proc log {m} { set f [open $log_path a]; puts $f $m; close $f }
set f [open $log_path w]; puts $f start; close $f
after time 7.1 { keymatrixdown 8 128 }
after time 9.1 {
  log "count=[debug read memory 0xC047] px=[debug read memory 0xC000] py=[debug read memory 0xC001] bx=[debug read memory 0xC04F] by=[debug read memory 0xC057] ms=[debug read memory 0xC04C] try_dx=[debug read memory 0xC048]"
  catch {screenshot "C:/Users/salam/Documents/Programacion/Mideas/screenshots/box2_debug_push.png"}
  after time 0.2 exit
}
