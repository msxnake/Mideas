# ZCode contest entry: door key edited into the HUD strip (top row) of the
# Area51 room. Captures the running ROM so the key icon is visible in-game.
set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_zcode_key.rom"
carta $rom_path

after time 2.0 {
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_zcode_key_hud_2s.png"
}
after time 5.5 {
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_zcode_key_hud_5s.png"
}
after time 7.5 {
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_zcode_key_hud_7s.png"
    after time 0.2 { exit }
}
