set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/probe_list.txt" "w"]
after time 12 {
    puts $f "debuggables: [debug list]"
    puts $f "slot ps0..3: [get_selected_slot 0] [get_selected_slot 1] [get_selected_slot 2] [get_selected_slot 3]"
    flush $f
    after time 1 { exit }
}
