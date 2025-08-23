from playwright.sync_api import sync_playwright, Page, expect
import os
import time

def run(page: Page):
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")

    # The file input is hidden. We use its id to select it.
    file_input = page.locator('#project-loader-input')

    # Get the absolute path to demo.json
    demo_json_path = os.path.abspath("demo.json")

    # Set the input files
    file_input.set_input_files(demo_json_path)

    # Wait for 5 seconds to give the UI time to update.
    time.sleep(5)

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/project_loaded.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        run(page)
        browser.close()

if __name__ == "__main__":
    main()
