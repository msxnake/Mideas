set screenshot_path "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/patoantic246_screen_cache_verify_test.png"

after 8000 {
    screenshot $screenshot_path
    after 1000 {
        exit
    }
}
