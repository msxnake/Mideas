from playwright.sync_api import sync_playwright, Page, expect
import os
import time

def run(page: Page):
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")

    # Load the project
    file_input = page.locator('#project-loader-input')
    demo_json_path = os.path.abspath("demo.json")
    file_input.set_input_files(demo_json_path)

    # Wait for 5 seconds to give the UI time to update.
    time.sleep(5)

    # The user mentioned that "pan1" is under "Screen Maps".

    # First, collapse the "Tiles" folder
    page.locator('button:has-text("Tiles")').first.click()

    # Then, expand the "Screen Maps" folder if it's not already expanded
    screen_maps_button = page.locator('button:has-text("Screen Maps")').first
    if screen_maps_button.get_attribute("aria-expanded") == "false":
        screen_maps_button.click()

    # Click on "pan1"
    page.locator('button:has-text("pan1")').click()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/pantalla1_screen.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        run(page)
        browser.close()

if __name__ == "__main__":
    main()
