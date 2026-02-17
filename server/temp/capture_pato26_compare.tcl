set __rom "C:/Users/salam/Downloads/pato26_unified_v2.rom"
set __shot "pato26_compare_0001.png"
puts "CAPTURE: loading $__rom"
if {[catch {carta $__rom} err]} {
    puts "CAPTURE ERROR: $err"
    exit 1
}
after 7000
if {[catch {screenshot $__shot} err2]} {
    puts "CAPTURE ERROR: $err2"
    exit 1
}
puts "CAPTURE: saved $__shot"
after 500
exit
