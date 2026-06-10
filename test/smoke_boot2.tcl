after time 8 {
    set fh [open $::env(SMOKE_OUT) w]
    puts $fh "pc=[format %04X [reg PC]]"
    catch { screenshot $::env(SMOKE_PNG) } msg
    puts $fh "shot=$msg"
    close $fh
    exit
}
