# TCL script to capture screenshot of white square game
# Wait a moment to ensure everything is loaded
after 3000

# Capture screenshot
set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]
screenshot "C:/Users/salam/Documents/Programacion/Mideas/white_square_game_$timestamp.png"

# Exit OpenMSX after screenshot
exit