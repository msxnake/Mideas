set out [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shop/shop_smoke_log.txt" w]

proc rd {addr} { return [debug read memory $addr] }
proc snap {label} {
    global out
    puts $out "$label: screen=[rd 0xC00B] x=[rd 0xC001] y=[rd 0xC000] gems=[rd 0xC0E8] inv=[rd 0xC0EC] lock=[rd 0xC0F5]"
    flush $out
}

# Hold RIGHT until player_x >= target, then release and run `next`.
proc walk_until {target next} {
    set x [rd 0xC001]
    if {$x >= $target} {
        keymatrixup 8 0x80
        after time 0.3 $next
    } else {
        keymatrixdown 8 0x80
        after time 0.1 [list walk_until $target $next]
    }
}

after time 4 {
    snap "boot"
    walk_until 72 step_at_item
}

proc step_at_item {} {
    snap "at_item_no_up"
    keymatrixdown 8 0x20
    after time 0.4 {
        keymatrixup 8 0x20
        after time 0.3 step_after_buy
    }
}

proc step_after_buy {} {
    snap "after_buy"
    keymatrixdown 8 0x20
    after time 0.4 {
        keymatrixup 8 0x20
        after time 0.3 step_after_second_up
    }
}

proc step_after_second_up {} {
    snap "after_second_up"
    walk_until 184 step_at_door
}

proc step_at_door {} {
    snap "at_door_touch_only"
    keymatrixdown 8 0x20
    after time 0.5 {
        keymatrixup 8 0x20
        after time 1.5 step_after_door
    }
}

proc step_after_door {} {
    snap "after_door_up"
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shop/shop_smoke.png"
    global out
    close $out
    exit
}
