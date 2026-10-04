# Half-width HUD font smoke: skip the presentation, shoot the HUD, talk to the
# NPC placed on the spawn (UP), shoot the typewriter mid-line and at line end.
# Env: HUDFONT_TAG=hudfont_4 (or hudfont_8), HUDFONT_DLG_STATE=<bitmap_dlg_state
# from the build's .sym, e.g. 0xD0E9>. Pass -romtype KonamiSCC after -cart.
set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-hudfont-4x8"
set tag $::env(HUDFONT_TAG)
set st $::env(HUDFONT_DLG_STATE)
set out [open "$dir/${tag}_probe.log" w]
proc plog {msg} { global out; puts $out $msg; flush $out }
proc st {} { global st; return [debug read memory $st] }

after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }
after time 14 {
    plog "room x=[debug read memory 0xC001] y=[debug read memory 0xC000] state=[st]"
    screenshot "$dir/${tag}_hud.png"
    keymatrixdown 8 0x20
}
after time 14.4 { keymatrixup 8 0x20 }
after time 15.2 {
    plog "after UP: state=[st] (1 = typing)"
    screenshot "$dir/${tag}_typing.png"
}
after time 22 {
    plog "line 1: state=[st] (2 = wait)"
    screenshot "$dir/${tag}_line1.png"
    keymatrixdown 8 0x20
}
after time 22.4 { keymatrixup 8 0x20 }
after time 28 {
    plog "line 2: state=[st]"
    screenshot "$dir/${tag}_line2.png"
    exit
}
