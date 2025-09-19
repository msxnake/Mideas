# Additional debugging commands for BasicEnemy ROM corruption analysis
# Load this script with: source debug_commands.tcl

proc quick_vdp_check {} {
    puts "\n=== QUICK VDP CHECK ==="

    # Basic VDP register check
    puts "VDP Registers:"
    for {set i 0} {$i < 8} {incr i} {
        set val [debug read "VDP_REG $i"]
        puts "  R$i: 0x[format %02X $val]"
    }

    # Critical checks
    set r1 [debug read "VDP_REG 1"]
    if {($r1 & 0x40) == 0} {
        puts "PROBLEM: Display is OFF (R1 bit 6 = 0)"
    } else {
        puts "OK: Display is ON"
    }

    set r0 [debug read "VDP_REG 0"]
    set r1 [debug read "VDP_REG 1"]

    if {($r0 & 0x02) && ($r1 & 0x08)} {
        puts "OK: Screen 2 mode appears to be set"
    } else {
        puts "PROBLEM: Not in Screen 2 mode"
        puts "  R0 bit 1: [expr {($r0 & 0x02) ? 1 : 0}] (should be 1)"
        puts "  R1 bit 3: [expr {($r1 & 0x08) ? 1 : 0}] (should be 1)"
    }
}

proc quick_vram_check {} {
    puts "\n=== QUICK VRAM CHECK ==="

    # Check pattern table
    set pattern_zeros 0
    for {set i 0} {$i < 32} {incr i} {
        set val [debug read "VRAM $i"]
        if {$val == 0} { incr pattern_zeros }
    }
    puts "Pattern Table (first 32 bytes): $pattern_zeros zeros out of 32"

    # Check name table
    set name_zeros 0
    for {set i 0x1800} {$i < 0x1820} {incr i} {
        set val [debug read "VRAM $i"]
        if {$val == 0} { incr name_zeros }
    }
    puts "Name Table (first 32 bytes): $name_zeros zeros out of 32"

    # Check color table
    set color_zeros 0
    for {set i 0x2000} {$i < 0x2020} {incr i} {
        set val [debug read "VRAM $i"]
        if {$val == 0} { incr color_zeros }
    }
    puts "Color Table (first 32 bytes): $color_zeros zeros out of 32"

    # Analysis
    if {$pattern_zeros > 30} {
        puts "PROBLEM: Pattern table appears empty"
    }
    if {$name_zeros > 30} {
        puts "PROBLEM: Name table appears empty"
    }
    if {$color_zeros > 30} {
        puts "PROBLEM: Color table appears empty"
    }
}

proc force_enable_display {} {
    puts "\n=== FORCING DISPLAY ENABLE ==="

    # Read current R1
    set r1 [debug read "VDP_REG 1"]
    puts "Current R1: 0x[format %02X $r1]"

    # Set display enable bit
    set new_r1 [expr {$r1 | 0x40}]

    debug write_io_port 0x99 $new_r1
    debug write_io_port 0x99 0x81

    puts "Set R1 to: 0x[format %02X $new_r1] (display enabled)"

    # Verify
    set verify_r1 [debug read "VDP_REG 1"]
    puts "Verified R1: 0x[format %02X $verify_r1]"

    if {($verify_r1 & 0x40)} {
        puts "SUCCESS: Display is now enabled"
    } else {
        puts "FAILED: Display still disabled"
    }
}

proc setup_minimal_screen2 {} {
    puts "\n=== SETTING UP MINIMAL SCREEN 2 ==="

    # Clear and setup basic Screen 2

    # R0: Graphics mode (bit 1 = 1)
    debug write_io_port 0x99 0x02
    debug write_io_port 0x99 0x80

    # R1: 16K VRAM, display on, screen 2 (bits 6,3 = 1)
    debug write_io_port 0x99 0x48
    debug write_io_port 0x99 0x81

    # R2: Name table at 0x1800 (bits 3-0 = 6)
    debug write_io_port 0x99 0x06
    debug write_io_port 0x99 0x82

    # R3: Color table at 0x2000 (value = 0x80)
    debug write_io_port 0x99 0x80
    debug write_io_port 0x99 0x83

    # R4: Pattern table at 0x0000 (value = 0x00)
    debug write_io_port 0x99 0x00
    debug write_io_port 0x99 0x84

    # R7: White text on blue background
    debug write_io_port 0x99 0x1F
    debug write_io_port 0x99 0x87

    puts "Basic Screen 2 setup completed"

    # Now put some test data in VRAM
    puts "Loading test pattern..."

    # Set VRAM write address to pattern table (0x0000)
    debug write_io_port 0x98 0x00
    debug write_io_port 0x99 0x40

    # Write test pattern (simple cross)
    set pattern [list 0x18 0x18 0x18 0x7E 0x7E 0x18 0x18 0x18]
    foreach byte $pattern {
        debug write_io_port 0x98 $byte
    }

    # Set VRAM write address to name table (0x1800)
    debug write_io_port 0x98 0x00
    debug write_io_port 0x99 0x58

    # Fill first line with pattern 0
    for {set i 0} {$i < 32} {incr i} {
        debug write_io_port 0x98 0x00
    }

    # Set VRAM write address to color table (0x2000)
    debug write_io_port 0x98 0x00
    debug write_io_port 0x99 0x60

    # Set colors (white on blue)
    for {set i 0} {$i < 32} {incr i} {
        debug write_io_port 0x98 0xF1
    }

    puts "Test data loaded. You should see a cross pattern on blue background."
}

proc dump_rom_header {} {
    puts "\n=== ROM HEADER ANALYSIS ==="

    puts "ROM at 0x4000-0x403F:"
    for {set i 0} {$i < 64} {incr i 16} {
        set line "  [format %04X [expr {0x4000 + $i}]]: "
        for {set j 0} {$j < 16 && [expr {$i + $j}] < 64} {incr j} {
            set addr [expr {0x4000 + $i + $j}]
            set val [peek $addr]
            append line "[format %02X $val] "
        }
        puts $line
    }

    # Check for MSX ROM signature
    set byte1 [peek 0x4000]
    set byte2 [peek 0x4001]

    if {$byte1 == 0x41 && $byte2 == 0x42} {
        puts "\nMSX ROM signature found: AB (ROM cartridge)"
    } else {
        puts "\nNo MSX ROM signature found (should be AB at 0x4000-0x4001)"
        puts "Found: [format %02X $byte1] [format %02X $byte2]"
    }

    # Check entry point
    set entry_low [peek 0x4002]
    set entry_high [peek 0x4003]
    set entry_point [expr {$entry_high * 256 + $entry_low}]
    puts "Entry point: 0x[format %04X $entry_point]"
}

proc monitor_vdp_writes {} {
    puts "\n=== MONITORING VDP WRITES ==="
    puts "Setting watchpoints on VDP ports..."

    # Monitor VDP data port (0x98)
    debug set_watchpoint write_io 0x98 {
        set data [reg A]
        puts "VDP DATA WRITE: 0x[format %02X $data]"
    }

    # Monitor VDP register port (0x99)
    debug set_watchpoint write_io 0x99 {
        set data [reg A]
        puts "VDP REG WRITE: 0x[format %02X $data]"
    }

    puts "VDP write monitoring enabled. Use 'debug remove_watchpoint' to stop."
}

proc step_through_init {} {
    puts "\n=== STEPPING THROUGH INITIALIZATION ==="
    puts "This will step through the first 50 instructions"
    puts "Press ENTER to continue, 'q' to quit"

    for {set i 0} {$i < 50} {incr i} {
        set pc [reg PC]
        set opcode [peek $pc]
        puts "\nStep $i: PC=0x[format %04X $pc], Opcode=0x[format %02X $opcode]"
        puts [info register]

        puts -nonewline "Continue? (ENTER/q): "
        flush stdout
        set input [gets stdin]
        if {$input == "q"} break

        debug step
    }
}

# Additional utility functions
proc peek_range {start end} {
    puts "Memory dump 0x[format %04X $start] - 0x[format %04X $end]:"
    for {set addr $start} {$addr <= $end} {incr addr 16} {
        set line "  [format %04X $addr]: "
        for {set i 0} {$i < 16 && [expr {$addr + $i}] <= $end} {incr i} {
            set val [peek [expr {$addr + $i}]]
            append line "[format %02X $val] "
        }
        puts $line
    }
}

proc save_state {filename} {
    puts "\n=== SAVING DEBUG STATE ==="
    set fp [open $filename w]

    puts $fp "=== CPU State ==="
    puts $fp [info register]

    puts $fp "\n=== VDP Registers ==="
    for {set i 0} {$i < 8} {incr i} {
        set val [debug read "VDP_REG $i"]
        puts $fp "R$i: 0x[format %02X $val]"
    }

    puts $fp "\n=== VRAM Sample ==="
    puts $fp "Pattern Table (0x0000-0x001F):"
    for {set i 0} {$i < 32} {incr i} {
        set val [debug read "VRAM $i"]
        puts $fp "  [format %04X $i]: [format %02X $val]"
    }

    close $fp
    puts "Debug state saved to: $filename"
}

puts "Additional debug commands loaded:"
puts "  quick_vdp_check       - Fast VDP status check"
puts "  quick_vram_check      - Fast VRAM content check"
puts "  force_enable_display  - Force enable VDP display"
puts "  setup_minimal_screen2 - Setup basic Screen 2 with test pattern"
puts "  dump_rom_header       - Analyze ROM header and signature"
puts "  monitor_vdp_writes    - Monitor all VDP port writes"
puts "  step_through_init     - Step through initialization code"
puts "  peek_range <start> <end> - Dump memory range"
puts "  save_state <filename> - Save debug state to file"