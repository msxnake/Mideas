from playwright.sync_api import sync_playwright, Page, expect

def run(page: Page):
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")

    # Click the "File" menu
    file_menu = page.get_by_role("button", name="File", exact=True)
    file_menu.click()

    # Take a screenshot of the file menu
    page.screenshot(path="jules-scratch/verification/file_menu.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        run(page)
        browser.close()

if __name__ == "__main__":
    main()
