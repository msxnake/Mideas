file mkdir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_smoke_dir"
set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_smoke_probe.log" "w"]
set root "C:/Users/salam/Documents/Programacion/Mideas"
set mode "unknown"
set p [format "%s/server/temp/joc52_%s_probe.log" $root $mode]
puts $f $p
flush $f
close $f
exit
