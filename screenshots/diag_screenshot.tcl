# Diagnostic: test screenshot command variations
set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set log_path "$ss_dir/diag_log.txt"

set lf [open $log_path "w"]
puts $lf "=== Diagnostic TCL ==="
puts $lf "Tcl version: [info tcl]"
close $lf

proc log_msg {msg} {
    global log_path
    set lf [open $log_path "a"]
    puts $lf $msg
    close $lf
    puts $msg
}

# T=2s: Try screenshot in all path formats and log the return value
after time 2.000 {
    log_msg ""
    log_msg "--- T=2s: attempting screenshots ---"

    # Test 1: No path (default location)
    set r1 [catch {screenshot} out1]
    log_msg "Test1 (no path): rc=$r1 out=$out1"

    # Test 2: Base name only (no extension)
    set r2 [catch {screenshot "diag_ss2"} out2]
    log_msg "Test2 (basename no ext): rc=$r2 out=$out2"

    # Test 3: Full path with forward slashes, no extension
    set path3 "C:/Users/salam/Documents/Programacion/Mideas/screenshots/diag_ss3"
    set r3 [catch {screenshot $path3} out3]
    log_msg "Test3 (full path no ext): rc=$r3 out=$out3"

    # Test 4: Full path with backslashes, no extension
    set path4 "C:\\Users\\salam\\Documents\\Programacion\\Mideas\\screenshots\\diag_ss4"
    set r4 [catch {screenshot $path4} out4]
    log_msg "Test4 (backslash no ext): rc=$r4 out=$out4"

    # Test 5: Full path with .png extension
    set path5 "C:/Users/salam/Documents/Programacion/Mideas/screenshots/diag_ss5.png"
    set r5 [catch {screenshot $path5} out5]
    log_msg "Test5 (full path with .png): rc=$r5 out=$out5"

    log_msg ""
    log_msg "--- Checking user dir ---"
    if {[catch {openmsx_info "version"} ver]} { set ver "N/A" }
    log_msg "OpenMSX version: $ver"
    if {[catch {file_locations} fl]} { set fl "N/A" }
    log_msg "file_locations: $fl"

    after time 2.500 { exit }
}
