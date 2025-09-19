# OpenMSX Debug Script for BasicEnemy_fixed.rom
# Specialized debugging for display corruption issues

proc debug_basicenemy {} {
    puts "=== MSX ROM DEBUGGING SESSION ==="
    puts "ROM: BasicEnemy_fixed.rom"
    puts "Issue: Display corruption (garbage on screen)"
    puts ""

    # Load the ROM
    set rom_path "C:/Users/salam/Downloads/BasicEnemy_fixed.rom"
    if {[file exists $rom_path]} {
        puts "Loading ROM: $rom_path"
        cart $rom_path
    } else {
        puts "ERROR: ROM file not found at $rom_path"
        return
    }

    # Reset system and start debugging
    reset
    after 2000
    puts "System reset completed"

    # Set up initial breakpoints for VDP initialization
    debug set_bp 0x4000 {debug_cart_entry}

    puts "Breakpoints set:"
    puts "- Cartridge entry: 0x4000"
    puts ""

    # Start execution
    puts "Starting execution..."
    debug cont
}

proc debug_cart_entry {} {
    puts "\n=== CARTRIDGE ENTRY HIT (0x4000) ==="
    debug_cpu_state
    debug_vdp_state

    # Take initial screenshot
    take_debug_screenshot "initial"

    # Set additional breakpoints for common VDP operations
    debug set_bp 0x4010 {debug_after_init}
    debug set_bp 0x4020 {debug_vdp_setup}
    debug set_bp 0x4030 {debug_main_loop}

    puts "Additional breakpoints set"
    puts "Type 'debug_interactive_mode' for interactive debugging"
    puts "Continuing execution..."
}

proc debug_after_init {} {
    puts "\n=== AFTER INITIALIZATION (0x4010) ==="
    debug_full_system_state
    debug_vram_content
    take_debug_screenshot "after_init"
}

proc debug_vdp_setup {} {
    puts "\n=== VDP SETUP POINT (0x4020) ==="
    debug_vdp_state
    debug_screen_mode
    take_debug_screenshot "vdp_setup"
}

proc debug_main_loop {} {
    puts "\n=== MAIN LOOP (0x4030) ==="
    debug_vdp_state
    debug_vram_content
    take_debug_screenshot "main_loop"
}

proc debug_cpu_state {} {
    puts "CPU State:"
    puts "  PC: 0x[format %04X [reg PC]]"
    puts "  SP: 0x[format %04X [reg SP]]"
    puts "  A:  0x[format %02X [reg A]]"
    puts "  BC: 0x[format %04X [reg BC]]"
    puts "  DE: 0x[format %04X [reg DE]]"
    puts "  HL: 0x[format %04X [reg HL]]"
}

proc debug_vdp_state {} {
    puts "VDP State:"
    debug_vdp_registers
    debug_screen_mode

    # Check VDP status
    set status [debug read_io_port 0x99]
    puts "  Status Register: 0x[format %02X $status]"
    if {($status & 0x80)} { puts "    - VBlank interrupt flag SET" }
    if {($status & 0x40)} { puts "    - Sprite collision flag SET" }
    if {($status & 0x20)} { puts "    - 5th sprite flag SET" }
}

proc debug_vdp_registers {} {
    puts "VDP Registers:"
    for {set i 0} {$i < 8} {incr i} {
        set reg_val [debug read "VDP_REG $i"]
        puts "  R$i: 0x[format %02X $reg_val] ([debug_vdp_reg_meaning $i $reg_val])"
    }
}

proc debug_vdp_reg_meaning {reg val} {
    switch $reg {
        0 {
            set mode [expr {($val & 0x02) ? "Graphics" : "Text"}]
            set ext [expr {($val & 0x01) ? ", External VDP" : ""}]
            return "Mode: $mode$ext"
        }
        1 {
            set size [expr {($val & 0x02) ? "16K" : "4K"}]
            set enable [expr {($val & 0x40) ? "ON" : "OFF"}]
            set mag [expr {($val & 0x01) ? ", 16x16 sprites" : ", 8x8 sprites"}]
            set int [expr {($val & 0x20) ? ", VBlank INT" : ""}]
            return "Size: $size, Display: $enable$mag$int"
        }
        2 { return "Name Table: 0x[format %04X [expr {($val & 0x0F) * 0x400}]]" }
        3 { return "Color Table: 0x[format %04X [expr {$val * 0x40}]]" }
        4 { return "Pattern Table: 0x[format %04X [expr {($val & 0x07) * 0x800}]]" }
        5 { return "Sprite Attr: 0x[format %04X [expr {($val & 0x7F) * 0x80}]]" }
        6 { return "Sprite Pat: 0x[format %04X [expr {($val & 0x07) * 0x800}]]" }
        7 { return "Border: [expr {$val >> 4}], Text: [expr {$val & 0x0F}]" }
        default { return "Unknown" }
    }
}

proc debug_screen_mode {} {
    set r0 [debug read "VDP_REG 0"]
    set r1 [debug read "VDP_REG 1"]

    set mode "Unknown"
    if {($r0 & 0x02) == 0} {
        if {($r1 & 0x18) == 0x00} { set mode "Text 1 (Screen 0)" }
        if {($r1 & 0x18) == 0x10} { set mode "Multicolor (Screen 3)" }
    } else {
        if {($r1 & 0x18) == 0x00} { set mode "Graphics 1 (Screen 1)" }
        if {($r1 & 0x18) == 0x08} { set mode "Graphics 2 (Screen 2)" }
    }

    puts "  Screen Mode: $mode"
    puts "  R0: 0x[format %02X $r0], R1: 0x[format %02X $r1]"

    # Specific Screen 2 analysis
    if {$mode == "Graphics 2 (Screen 2)"} {
        debug_screen2_analysis
    }
}

proc debug_screen2_analysis {} {
    puts "\n--- Screen 2 Mode Analysis ---"
    set r2 [debug read "VDP_REG 2"]
    set r3 [debug read "VDP_REG 3"]
    set r4 [debug read "VDP_REG 4"]

    set name_base [expr {($r2 & 0x0F) * 0x400}]
    set color_base [expr {$r3 * 0x40}]
    set pattern_base [expr {($r4 & 0x07) * 0x800}]

    puts "  Name Table Base: 0x[format %04X $name_base]"
    puts "  Color Table Base: 0x[format %04X $color_base]"
    puts "  Pattern Table Base: 0x[format %04X $pattern_base]"

    # Screen 2 should have specific values for proper operation
    if {$name_base != 0x1800} {
        puts "  WARNING: Name table not at standard 0x1800 address"
    }
    if {$color_base != 0x2000} {
        puts "  WARNING: Color table not at standard 0x2000 address"
    }
    if {$pattern_base != 0x0000} {
        puts "  WARNING: Pattern table not at standard 0x0000 address"
    }
}

proc debug_vram_content {} {
    puts "\nVRAM Content Analysis:"

    # Pattern Table (Graphics data)
    puts "Pattern Table (0x0000-0x17FF):"
    debug_vram_dump 0x0000 0x100 "pattern"

    # Name Table (which patterns to display where)
    puts "Name Table (0x1800-0x1AFF):"
    debug_vram_dump 0x1800 0x100 "name"

    # Color Table (colors for each pattern)
    puts "Color Table (0x2000-0x37FF):"
    debug_vram_dump 0x2000 0x100 "color"

    # Sprite Attribute Table
    puts "Sprite Attributes (0x1B00-0x1B7F):"
    debug_vram_dump 0x1B00 0x80 "sprite_attr"
}

proc debug_vram_dump {start_addr length type} {
    puts "  Address 0x[format %04X $start_addr] - 0x[format %04X [expr {$start_addr + $length - 1}]]:"

    set sample_count 16
    for {set i 0} {$i < $sample_count && $i < $length} {incr i 4} {
        set addr [expr {$start_addr + $i}]
        set data ""
        for {set j 0} {$j < 4 && [expr {$i + $j}] < $length} {incr j} {
            set byte [debug read "VRAM [expr {$addr + $j}]"]
            append data "[format %02X $byte] "
        }
        puts "    0x[format %04X $addr]: $data"
    }

    # Analyze pattern
    debug_analyze_vram_pattern $start_addr $length $type
}

proc debug_analyze_vram_pattern {start_addr length type} {
    set zero_count 0
    set ff_count 0
    set pattern_count 0

    set sample_size [expr {min($length, 256)}]

    for {set i 0} {$i < $sample_size} {incr i} {
        set byte [debug read "VRAM [expr {$start_addr + $i}]"]
        if {$byte == 0x00} { incr zero_count }
        if {$byte == 0xFF} { incr ff_count }
        if {$byte != 0x00 && $byte != 0xFF} { incr pattern_count }
    }

    puts "    Analysis: Zero: $zero_count, FF: $ff_count, Pattern: $pattern_count / $sample_size bytes"

    if {$zero_count > [expr {$sample_size * 0.9}]} {
        puts "    ERROR: Mostly zeros - $type data NOT LOADED properly!"
    } elseif {$ff_count > [expr {$sample_size * 0.9}]} {
        puts "    ERROR: Mostly 0xFF - $type area uninitialized!"
    } elseif {$pattern_count < [expr {$sample_size * 0.1}]} {
        puts "    WARNING: Very little pattern data in $type area"
    } else {
        puts "    OK: $type data appears to be loaded"
    }
}

proc debug_full_system_state {} {
    puts "\n=== FULL SYSTEM STATE ==="
    debug_cpu_state
    debug_vdp_state

    # Check if screen is enabled
    set r1 [debug read "VDP_REG 1"]
    if {($r1 & 0x40) == 0} {
        puts "CRITICAL: Screen display is DISABLED (VDP R1 bit 6 = 0)"
        puts "This will cause garbage/blank screen!"
    } else {
        puts "Screen display is ENABLED"
    }

    # Check interrupt enable
    if {($r1 & 0x20) != 0} {
        puts "VBlank interrupt is ENABLED"
    } else {
        puts "VBlank interrupt is DISABLED"
    }
}

proc take_debug_screenshot {stage} {
    set timestamp [clock format [clock seconds] -format "%m%d%y_%H%M%S"]
    set filename "debug_basicenemy_${stage}_$timestamp.png"
    set filepath "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/$filename"

    screenshot $filepath
    puts "Screenshot saved: $filepath"
    return $filepath
}

proc debug_interactive_mode {} {
    puts "\n=== INTERACTIVE DEBUG MODE ==="
    puts "Available commands:"
    puts "  vdp_state     - Show current VDP state"
    puts "  vram_dump     - Dump VRAM content"
    puts "  cpu_state     - Show CPU registers"
    puts "  screenshot    - Take screenshot"
    puts "  step          - Single step execution"
    puts "  cont          - Continue execution"
    puts "  check_corruption - Analyze corruption patterns"
    puts "  fix_screen2   - Try to fix Screen 2 setup"
    puts "  quit          - Exit debug mode"
    puts ""

    while {1} {
        puts -nonewline "debug> "
        flush stdout
        gets stdin cmd

        switch $cmd {
            "vdp_state" { debug_vdp_state }
            "vram_dump" { debug_vram_content }
            "cpu_state" { debug_cpu_state }
            "screenshot" { take_debug_screenshot "manual" }
            "step" { debug step }
            "cont" { debug cont; break }
            "check_corruption" { check_corruption_patterns }
            "fix_screen2" { fix_screen2_setup }
            "quit" { break }
            "" { continue }
            default { puts "Unknown command: $cmd" }
        }
    }
}

proc check_corruption_patterns {} {
    puts "\n=== CORRUPTION PATTERN ANALYSIS ==="

    # Check if the issue is uninitialized VRAM
    puts "1. Checking for uninitialized VRAM..."
    debug_vram_content

    # Check if VDP registers are properly set
    puts "\n2. Checking VDP register configuration..."
    debug_vdp_state

    # Check specific corruption indicators
    puts "\n3. Looking for common corruption causes..."

    set r1 [debug read "VDP_REG 1"]
    if {($r1 & 0x40) == 0} {
        puts "FOUND: Display disabled - this causes garbage display!"
    }

    set r0 [debug read "VDP_REG 0"]
    set r1 [debug read "VDP_REG 1"]
    if {($r0 & 0x02) && ($r1 & 0x08) == 0} {
        puts "FOUND: Graphics mode but not Screen 2 - may show garbage"
    }

    puts "\n4. Recommended actions:"
    puts "   - Verify VDP initialization code in ROM"
    puts "   - Check if VRAM data loading is working"
    puts "   - Ensure proper Screen 2 mode setup"
}

proc fix_screen2_setup {} {
    puts "\n=== ATTEMPTING SCREEN 2 FIX ==="
    puts "Manually setting up Screen 2 mode..."

    # Set Screen 2 mode
    debug write_io_port 0x99 0x02  ; # R0: Graphics mode
    debug write_io_port 0x99 0x80  ; # Register 0

    debug write_io_port 0x99 0x6A  ; # R1: 16K VRAM, Display on, VBlank int, Screen 2
    debug write_io_port 0x99 0x81  ; # Register 1

    debug write_io_port 0x99 0x06  ; # R2: Name table at 0x1800
    debug write_io_port 0x99 0x82  ; # Register 2

    debug write_io_port 0x99 0x80  ; # R3: Color table at 0x2000
    debug write_io_port 0x99 0x83  ; # Register 3

    debug write_io_port 0x99 0x00  ; # R4: Pattern table at 0x0000
    debug write_io_port 0x99 0x84  ; # Register 4

    debug write_io_port 0x99 0x36  ; # R5: Sprite attribute at 0x1B00
    debug write_io_port 0x99 0x85  ; # Register 5

    debug write_io_port 0x99 0x07  ; # R6: Sprite pattern at 0x3800
    debug write_io_port 0x99 0x86  ; # Register 6

    debug write_io_port 0x99 0x17  ; # R7: Border color 1, text color 7
    debug write_io_port 0x99 0x87  ; # Register 7

    puts "Screen 2 setup completed. Taking screenshot..."
    take_debug_screenshot "fixed_screen2"

    puts "Check if display improved. Use 'vdp_state' to verify settings."
}

# Main execution
puts "Debug script loaded for BasicEnemy_fixed.rom"
puts "Use 'debug_basicenemy' to start debugging session."
puts "After breakpoints hit, use 'debug_interactive_mode' for interactive debugging."