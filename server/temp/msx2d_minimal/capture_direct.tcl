puts "DIRECT_CAPTURE_START"
after time 6000 {
  puts "DIRECT_CAPTURE_SCREENSHOT"
  if {[catch {screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/msx2d_minimal/msx2d_platform_minimal_direct_openmsx.png"} err]} {
    puts "DIRECT_CAPTURE_ERROR: "
    exit 2
  }
  puts "DIRECT_CAPTURE_DONE"
  exit
}
vwait forever
