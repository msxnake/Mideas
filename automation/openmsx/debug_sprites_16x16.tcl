# OpenMSX TCL Script - Debug Sprites 16x16 Configuration
# Purpose: Detailed inspection of sprite configuration and VDP settings

proc log_debug {msg} {
    puts "[clock format [clock seconds] -format {%H:%M:%S}] DEBUG: $msg"
}

proc inspect_sprite_configuration {} {
    log_debug "=== DETAILED SPRITE CONFIGURATION ANALYSIS ==="

    # Load ROM
    set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/BasicEnemy_16x16.rom"
    log_debug "Loading ROM: $rom_path"

    catch {
        carta $rom_path
        reset
        after 6000
    }

    # VDP Register Analysis
    log_debug "=== VDP REGISTERS ==="
    for {set i 0} {$i < 8} {incr i} {
        set reg_value [debug read "VDP regs" $i]
        log_debug "VDP R$i: [format "0x%02X (%d) - %08b" $reg_value $reg_value $reg_value]"
    }

    # Specific R1 analysis
    set vdp_r1 [debug read "VDP regs" 1]
    log_debug ""
    log_debug "=== VDP R1 DETAILED ANALYSIS ==="
    log_debug "VDP R1 value: [format "0x%02X" $vdp_r1]"
    log_debug "Bit 0 (MAG): [expr {($vdp_r1 & 0x01) ? "Sprites magnified" : "Normal sprite size"}]"
    log_debug "Bit 1 (SIZE): [expr {($vdp_r1 & 0x02) ? "16x16 sprites" : "8x8 sprites"}]"
    log_debug "Bit 2: [expr {($vdp_r1 & 0x04) ? "Reserved bit set" : "Reserved bit clear"}]"
    log_debug "Bit 3 (IE): [expr {($vdp_r1 & 0x08) ? "Interrupts enabled" : "Interrupts disabled"}]"
    log_debug "Bit 4 (M1): [expr {($vdp_r1 & 0x10) ? "Set" : "Clear"}]"
    log_debug "Bit 5 (M2): [expr {($vdp_r1 & 0x20) ? "Set" : "Clear"}]"

    # Screen mode analysis
    set vdp_r0 [debug read "VDP regs" 0]
    set m1 [expr {($vdp_r1 & 0x10) >> 4}]
    set m2 [expr {($vdp_r1 & 0x20) >> 5}]
    set m3 [expr {($vdp_r0 & 0x02) >> 1}]
    log_debug "Screen Mode: M1=$m1 M2=$m2 M3=$m3"

    # Sprite Attribute Table Analysis
    log_debug ""
    log_debug "=== SPRITE ATTRIBUTE TABLE ==="
    set sprite_attr_base 0x1B00

    for {set sprite 0} {$sprite < 32} {incr sprite} {
        set addr [expr $sprite_attr_base + ($sprite * 4)]
        set y_pos [debug read "VRAM" $addr]
        set x_pos [debug read "VRAM" [expr $addr + 1]]
        set pattern [debug read "VRAM" [expr $addr + 2]]
        set color_attr [debug read "VRAM" [expr $addr + 3]]

        # Stop at terminator
        if {$y_pos == 208} {
            log_debug "Sprite $sprite: TERMINATOR (Y=208)"
            break
        }

        if {$y_pos != 0 || $x_pos != 0 || $pattern != 0} {
            set color [expr {$color_attr & 0x0F}]
            set early_clock [expr {($color_attr & 0x80) ? "YES" : "NO"}]
            log_debug "Sprite $sprite: Y=$y_pos X=$x_pos Pattern=$pattern Color=$color EC=$early_clock"
        }
    }

    # Sprite Pattern Generator Analysis
    log_debug ""
    log_debug "=== SPRITE PATTERN ANALYSIS ==="
    set sprite_pattern_base 0x1800

    # Check first few patterns
    for {set pattern 0} {$pattern < 4} {incr pattern} {
        log_debug "Pattern $pattern:"
        set base_addr [expr $sprite_pattern_base + ($pattern * 32)]

        # For 16x16 sprites, each pattern uses 32 bytes (4 rows of 8 bytes each)
        for {set row 0} {$row < 4} {incr row} {
            set line ""
            for {set byte 0} {$byte < 8} {incr byte} {
                set addr [expr $base_addr + ($row * 8) + $byte]
                set value [debug read "VRAM" $addr]
                append line "[format "%02X " $value]"
            }
            log_debug "  Row $row: $line"
        }
        log_debug ""
    }

    # Color Table Check
    log_debug "=== COLOR TABLE CHECK ==="
    set color_table_base 0x2000
    for {set i 0} {$i < 16} {incr i} {
        set color_byte [debug read "VRAM" [expr $color_table_base + $i]]
        log_debug "Color $i: [format "0x%02X" $color_byte]"
    }

    log_debug "=== ANALYSIS COMPLETE ==="
}

# Execute inspection
inspect_sprite_configuration