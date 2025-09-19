# ==================================================================
# MSX Graphics Debugging Script for OpenMSX
# File: msx_graphics_debug.tcl
# Purpose: Complete debugging session for BasicEnemy ROM
# ==================================================================

# Configuration
set ROM_PATH "C:/Users/salam/Documents/Programacion/Mideas/server/temp/basicenemy_generated.rom"
set SCREENSHOT_DIR "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots"
set DEBUG_LOG "C:/Users/salam/Documents/Programacion/Mideas/automation/debugging/debug_session.log"

# ==================================================================
# UTILITY FUNCTIONS
# ==================================================================

proc log_debug {message} {
    global DEBUG_LOG
    set timestamp [clock format [clock seconds] -format "%Y-%m-%d %H:%M:%S"]
    set logfile [open $DEBUG_LOG a]
    puts $logfile "\[$timestamp\] $message"
    close $logfile
    puts "DEBUG: $message"
}

proc take_screenshot {name} {
    global SCREENSHOT_DIR
    set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]
    set filename "$SCREENSHOT_DIR/debug_${name}_${timestamp}.png"
    screenshot $filename
    log_debug "Screenshot saved: $filename"
    return $filename
}

proc hex_dump {address size {name ""}} {
    set result ""
    if {$name != ""} {
        append result "=== $name ===\n"
    }
    append result "Address  | Data\n"
    append result "---------+----------------------------------\n"

    for {set i 0} {$i < $size} {incr i 16} {
        set addr [expr $address + $i]
        append result [format "%04X: " $addr]

        for {set j 0} {$j < 16 && [expr $i + $j] < $size} {incr j} {
            set byte_addr [expr $addr + $j]
            set byte_val [peek $byte_addr]
            append result [format "%02X " $byte_val]
        }
        append result "\n"
    }
    return $result
}

# ==================================================================
# VDP DEBUGGING FUNCTIONS
# ==================================================================

proc check_vdp_status {} {
    log_debug "=== VDP STATUS CHECK ==="

    # VDP Status Register
    set vdp_status [vdp_info status]
    log_debug "VDP Status: $vdp_status"

    # VDP Registers (0-7 for MSX1)
    log_debug "VDP Registers:"
    for {set i 0} {$i <= 7} {incr i} {
        set reg_val [vdp_info reg $i]
        log_debug "  R$i: [format "%02X" $reg_val] ([format "%d" $reg_val])"
    }

    # Screen mode analysis
    set r0 [vdp_info reg 0]
    set r1 [vdp_info reg 1]
    set mode [expr (($r0 & 0x0E) >> 1) | (($r1 & 0x18) >> 1)]
    log_debug "Current screen mode: $mode"

    # Check if Screen 2 is properly set
    if {$mode == 2} {
        log_debug "Screen 2 mode is correctly set"
    } else {
        log_debug "WARNING: Expected Screen 2, got mode $mode"
    }
}

proc check_vram_contents {} {
    log_debug "=== VRAM CONTENTS CHECK ==="

    # Pattern Name Table (Screen 2: 0x1800-0x1AFF)
    log_debug "Pattern Name Table (0x1800-0x18FF):"
    set name_data ""
    for {set i 0x1800} {$i <= 0x18FF} {incr i} {
        set val [vdp info vram $i]
        append name_data [format "%02X " $val]
        if {[expr ($i - 0x1800 + 1) % 16] == 0} {
            log_debug "  [format "%04X" [expr $i - 15]]: $name_data"
            set name_data ""
        }
    }

    # Pattern Generator Table (Screen 2: 0x0000-0x17FF)
    log_debug "Pattern Generator Table (first 256 bytes):"
    set pattern_data ""
    for {set i 0x0000} {$i <= 0x00FF} {incr i} {
        set val [vdp info vram $i]
        append pattern_data [format "%02X " $val]
        if {[expr ($i + 1) % 16] == 0} {
            log_debug "  [format "%04X" [expr $i - 15]]: $pattern_data"
            set pattern_data ""
        }
    }

    # Color Table (Screen 2: 0x2000-0x37FF)
    log_debug "Color Table (first 256 bytes):"
    set color_data ""
    for {set i 0x2000} {$i <= 0x20FF} {incr i} {
        set val [vdp info vram $i]
        append color_data [format "%02X " $val]
        if {[expr ($i - 0x2000 + 1) % 16] == 0} {
            log_debug "  [format "%04X" [expr $i - 15]]: $color_data"
            set color_data ""
        }
    }

    # Sprite Attribute Table (0x1B00-0x1B7F)
    log_debug "Sprite Attribute Table (0x1B00-0x1B7F):"
    set sprite_data ""
    for {set i 0x1B00} {$i <= 0x1B7F} {incr i} {
        set val [vdp info vram $i]
        append sprite_data [format "%02X " $val]
        if {[expr ($i - 0x1B00 + 1) % 16] == 0} {
            log_debug "  [format "%04X" [expr $i - 15]]: $sprite_data"
            set sprite_data ""
        }
    }

    # Sprite Pattern Table (0x3800-0x3FFF)
    log_debug "Sprite Pattern Table (first 256 bytes):"
    set sprite_pattern_data ""
    for {set i 0x3800} {$i <= 0x38FF} {incr i} {
        set val [vdp info vram $i]
        append sprite_pattern_data [format "%02X " $val]
        if {[expr ($i - 0x3800 + 1) % 16] == 0} {
            log_debug "  [format "%04X" [expr $i - 15]]: $sprite_pattern_data"
            set sprite_pattern_data ""
        }
    }
}

proc check_cpu_state {} {
    log_debug "=== CPU STATE CHECK ==="

    # CPU Registers
    log_debug "CPU Registers:"
    log_debug "  PC: [format "%04X" [reg PC]]"
    log_debug "  SP: [format "%04X" [reg SP]]"
    log_debug "  A:  [format "%02X" [reg A]]"
    log_debug "  BC: [format "%04X" [reg BC]]"
    log_debug "  DE: [format "%04X" [reg DE]]"
    log_debug "  HL: [format "%04X" [reg HL]]"
    log_debug "  F:  [format "%02X" [reg F]]"

    # Memory around PC
    set pc [reg PC]
    log_debug "Memory around PC ($pc):"
    set mem_dump [hex_dump [expr $pc - 8] 32 "PC Context"]
    log_debug $mem_dump

    # Stack area
    set sp [reg SP]
    log_debug "Stack area around SP ($sp):"
    set stack_dump [hex_dump [expr $sp - 16] 32 "Stack"]
    log_debug $stack_dump
}

proc analyze_rom_structure {} {
    log_debug "=== ROM STRUCTURE ANALYSIS ==="

    # Check ROM header
    log_debug "ROM Header (0x4000-0x400F):"
    set header_dump [hex_dump 0x4000 16 "ROM Header"]
    log_debug $header_dump

    # Check if cartridge signature is present
    set sig1 [peek 0x4000]
    set sig2 [peek 0x4001]
    if {$sig1 == 0x41 && $sig2 == 0x42} {
        log_debug "Valid cartridge signature found: AB"

        # Get initialization address
        set init_low [peek 0x4002]
        set init_high [peek 0x4003]
        set init_addr [expr $init_high * 256 + $init_low]
        log_debug "Initialization address: [format "%04X" $init_addr]"

        # Analyze code at initialization address
        log_debug "Code at initialization address:"
        set init_dump [hex_dump $init_addr 64 "Initialization Code"]
        log_debug $init_dump

    } else {
        log_debug "WARNING: Invalid cartridge signature: [format "%02X %02X" $sig1 $sig2]"
    }

    # Check main program area
    log_debug "Main program area (0x4010-0x404F):"
    set main_dump [hex_dump 0x4010 64 "Main Program"]
    log_debug $main_dump
}

# ==================================================================
# BREAKPOINT FUNCTIONS
# ==================================================================

proc set_debugging_breakpoints {} {
    log_debug "=== SETTING DEBUGGING BREAKPOINTS ==="

    # Clear existing breakpoints
    debug remove_breakpoint

    # Breakpoint at cartridge initialization
    debug set_breakpoint 0x4000 {log_debug "ROM execution started"; check_cpu_state; return ""}

    # Breakpoint at CHGMOD call (change to Screen 2)
    debug set_watchpoint write 0x005F {log_debug "CHGMOD called - changing screen mode"; check_vdp_status; return ""}

    # Breakpoint at CLS call
    debug set_watchpoint write 0x00C3 {log_debug "CLS called - clearing screen"; return ""}

    # Breakpoint at main program start
    debug set_breakpoint 0x4030 {log_debug "Main program started"; check_cpu_state; check_vdp_status; return ""}

    # Breakpoint at main loop
    debug set_breakpoint 0x4032 {log_debug "Main loop iteration"; check_cpu_state; return ""}

    # VDP register write monitoring
    debug set_watchpoint write 0x99 {log_debug "VDP register write detected"; check_vdp_status; return ""}

    # VDP data write monitoring
    debug set_watchpoint write 0x98 {log_debug "VDP data write detected"; return ""}

    log_debug "Breakpoints set successfully"
}

# ==================================================================
# MAIN DEBUGGING SESSION
# ==================================================================

proc start_debug_session {} {
    global ROM_PATH

    log_debug "========================================="
    log_debug "Starting MSX Graphics Debug Session"
    log_debug "========================================="

    # Initialize debug log
    set logfile [open $::DEBUG_LOG w]
    close $logfile

    log_debug "ROM Path: $ROM_PATH"

    # Check if ROM exists and get size
    if {[file exists $ROM_PATH]} {
        set rom_size [file size $ROM_PATH]
        log_debug "ROM Size: $rom_size bytes"

        if {$rom_size < 100} {
            log_debug "WARNING: ROM is very small ($rom_size bytes) - may indicate compilation error"
        }
    } else {
        log_debug "ERROR: ROM file not found: $ROM_PATH"
        return
    }

    # Take initial screenshot
    take_screenshot "initial"

    # Reset machine
    reset
    after 1000

    # Insert ROM
    cart $ROM_PATH
    log_debug "ROM inserted: $ROM_PATH"

    # Take screenshot after ROM insertion
    take_screenshot "rom_inserted"

    # Set up debugging breakpoints
    set_debugging_breakpoints

    # Analyze ROM structure before execution
    analyze_rom_structure

    # Initial system state
    check_cpu_state
    check_vdp_status

    log_debug "Debug session initialized. Use 'run_debug_tests' to execute tests."
}

proc run_debug_tests {} {
    log_debug "========================================="
    log_debug "Running Debug Tests"
    log_debug "========================================="

    # Test 1: Run for 1000 cycles and check state
    log_debug "Test 1: Running 1000 cycles..."
    step 1000
    take_screenshot "after_1000_cycles"
    check_cpu_state
    check_vdp_status

    # Test 2: Run for 10000 more cycles
    log_debug "Test 2: Running 10000 more cycles..."
    step 10000
    take_screenshot "after_11000_cycles"
    check_vdp_status
    check_vram_contents

    # Test 3: Run for 1 second of emulation time
    log_debug "Test 3: Running for 1 second..."
    set start_time [machine_info time]
    while {[expr [machine_info time] - $start_time] < 1000000} {
        step 1000
    }
    take_screenshot "after_1_second"
    check_cpu_state
    check_vdp_status
    check_vram_contents

    log_debug "Debug tests completed."
}

proc manual_vdp_setup {} {
    log_debug "========================================="
    log_debug "Manual VDP Setup for Screen 2"
    log_debug "========================================="

    # Manual Screen 2 setup
    vdp reg 0 0x02   ; M3=0, M4=0, M5=1 (bit 1 set for Graphics II)
    vdp reg 1 0xE2   ; Screen enable, M1=1, M2=1, 16x16 sprites, no zoom
    vdp reg 2 0x06   ; Name table at 0x1800 (6 * 0x400 = 0x1800)
    vdp reg 3 0xFF   ; Color table at 0x2000 (for screen 2)
    vdp reg 4 0x03   ; Pattern table at 0x0000 (for screen 2)
    vdp reg 5 0x36   ; Sprite attribute table at 0x1B00
    vdp reg 6 0x07   ; Sprite pattern table at 0x3800
    vdp reg 7 0xF1   ; Foreground white, background black

    log_debug "VDP registers manually configured for Screen 2"
    check_vdp_status

    # Clear name table
    for {set i 0x1800} {$i <= 0x1AFF} {incr i} {
        vdp set vram $i 0x00
    }

    # Set up a simple test pattern
    # Fill pattern generator with a test pattern
    for {set i 0x0000} {$i <= 0x07FF} {incr i 8} {
        vdp set vram $i 0xFF
        vdp set vram [expr $i+1] 0x81
        vdp set vram [expr $i+2] 0x81
        vdp set vram [expr $i+3] 0x81
        vdp set vram [expr $i+4] 0x81
        vdp set vram [expr $i+5] 0x81
        vdp set vram [expr $i+6] 0x81
        vdp set vram [expr $i+7] 0xFF
    }

    # Set colors for the pattern
    for {set i 0x2000} {$i <= 0x27FF} {incr i} {
        vdp set vram $i 0xF1  ; White on black
    }

    # Put some tiles on screen
    for {set i 0x1800} {$i <= 0x181F} {incr i} {
        vdp set vram $i [expr $i - 0x1800]
    }

    # Create a test sprite
    vdp set vram 0x1B00 50    ; Y position
    vdp set vram 0x1B01 50    ; X position
    vdp set vram 0x1B02 0     ; Pattern number
    vdp set vram 0x1B03 0x0F  ; Color (white)

    # Set sprite pattern
    for {set i 0x3800} {$i <= 0x3807} {incr i} {
        vdp set vram $i 0xFF
    }
    for {set i 0x3808} {$i <= 0x380F} {incr i} {
        vdp set vram $i 0xFF
    }

    log_debug "Test pattern and sprite created"
    take_screenshot "manual_setup_complete"
    check_vram_contents
}

# ==================================================================
# INTERACTIVE DEBUGGING COMMANDS
# ==================================================================

proc show_debug_help {} {
    puts "=== MSX Graphics Debug Commands ==="
    puts "start_debug_session    - Initialize debugging session"
    puts "run_debug_tests        - Run automated debug tests"
    puts "manual_vdp_setup       - Manually configure VDP for testing"
    puts "check_vdp_status       - Check VDP registers and status"
    puts "check_vram_contents    - Examine VRAM contents"
    puts "check_cpu_state        - Show CPU state and memory"
    puts "analyze_rom_structure  - Analyze ROM header and code"
    puts "take_screenshot [name] - Take a screenshot"
    puts "hex_dump addr size     - Show hex dump of memory"
    puts "show_debug_help        - Show this help"
    puts ""
    puts "Example usage:"
    puts "  start_debug_session"
    puts "  run_debug_tests"
    puts "  manual_vdp_setup"
}

# Display help on script load
show_debug_help

log_debug "MSX Graphics Debug Script Loaded"
log_debug "Use 'start_debug_session' to begin debugging"