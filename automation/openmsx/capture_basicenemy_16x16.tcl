# OpenMSX TCL Script - Capture BasicEnemy 16x16 Sprites Screenshot
# Purpose: Verify that sprites appear correctly in 16x16 size

proc log_message {msg} {
    puts "$msg"
}

proc capture_basicenemy_16x16 {} {
    log_message "Starting BasicEnemy 16x16 sprite verification..."

    # Insert ROM cartridge
    set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/BasicEnemy_16x16.rom"
    log_message "Loading ROM: $rom_path"

    catch {
        carta $rom_path
        log_message "ROM loaded successfully"
    } error

    if {$error != ""} {
        log_message "Error loading ROM: $error"
        return
    }

    # Reset and start execution
    log_message "Resetting MSX and starting execution..."
    reset

    # Wait for ROM to initialize and execute
    log_message "Waiting 5 seconds for ROM initialization..."
    after 5000

    # Check VDP registers for sprite configuration
    log_message "Checking VDP registers..."
    set vdp_r1 [debug read "VDP regs" 1]
    log_message "VDP Register R1: [format "0x%02X" $vdp_r1]"

    if {($vdp_r1 & 0x02) != 0} {
        log_message "SUCCESS: VDP R1 bit 1 is set - 16x16 sprites enabled"
    } else {
        log_message "WARNING: VDP R1 bit 1 not set - sprites may be 8x8"
    }

    # Check sprite attribute table
    log_message "Checking sprite attributes..."
    for {set i 0} {$i < 4} {incr i} {
        set sprite_addr [expr 0x1B00 + ($i * 4)]
        set y_pos [debug read "VRAM" $sprite_addr]
        set x_pos [debug read "VRAM" [expr $sprite_addr + 1]]
        set pattern [debug read "VRAM" [expr $sprite_addr + 2]]
        set color [debug read "VRAM" [expr $sprite_addr + 3]]

        if {$y_pos != 208} {
            log_message "Sprite $i: Y=$y_pos X=$x_pos Pattern=$pattern Color=[format "0x%02X" $color]"
        }
    }

    # Wait additional time for any animations
    log_message "Waiting 2 more seconds for sprite display..."
    after 2000

    # Generate timestamp for unique filename
    set timestamp [expr {int([clock seconds])}]
    set screenshot_name "BasicEnemy_16x16_sprites_$timestamp.png"
    set screenshot_path "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/$screenshot_name"

    # Capture screenshot
    log_message "Capturing screenshot: $screenshot_name"
    catch {
        screenshot $screenshot_path
        log_message "Screenshot saved: $screenshot_path"
    } error

    if {$error != ""} {
        log_message "Error capturing screenshot: $error"
    } else {
        log_message "Screenshot capture completed successfully"

        # Additional debug info
        log_message "=== SPRITE DEBUG SUMMARY ==="
        log_message "ROM: BasicEnemy_16x16.rom"
        log_message "VDP R1: [format "0x%02X" $vdp_r1] (16x16 sprites: [expr {($vdp_r1 & 0x02) ? "ENABLED" : "DISABLED"}])"
        log_message "Screenshot: $screenshot_path"
        log_message "Expected: bot1 sprite should appear as 16x16 pixels"
        log_message "Expected: brick1 tile should be visible on screen"
    }

    return $screenshot_path
}

# Execute the capture function
set result [capture_basicenemy_16x16]
log_message "Script completed. Result: $result"