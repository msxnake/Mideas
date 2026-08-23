# Verify the freshly recompiled canonical ROM: bosses, lasers and HUD key.
set rom_path "C:/Users/salam/Downloads/test556_dualboss.rom"
carta $rom_path

after time 7.5 {
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_canonical_7s.png"
}
after time 8.5 {
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_canonical_8s.png"
    after time 0.2 { exit }
}
