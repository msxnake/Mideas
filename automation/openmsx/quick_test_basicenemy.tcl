# Quick test for BasicEnemy ROM
puts "=== BasicEnemy ROM Test ==="
puts "Loading ROM..."

# Load ROM directly
carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/BasicEnemy.rom"
puts "ROM loaded successfully"

# Show VDP info
puts "VDP Mode: [debug read_register VIDCTRL]"

# Wait and capture
puts "Waiting 5 seconds..."
after 5000

# Create screenshot with simple name
set screenshot_file "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/BasicEnemy_quick_test.png"
puts "Capturing to: $screenshot_file"

# Try screenshot
if {[catch {screenshot $screenshot_file} error]} {
    puts "Screenshot failed: $error"
    puts "Trying alternative method..."
    if {[catch {savescreen $screenshot_file} error2]} {
        puts "Savescreen also failed: $error2"
    } else {
        puts "Savescreen successful!"
    }
} else {
    puts "Screenshot successful!"
}

# Small delay then exit
after 1000
exit