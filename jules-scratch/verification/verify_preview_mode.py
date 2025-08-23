from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the application
        page.goto("http://localhost:5173/")

        # 2. Click the "Preview" button
        preview_button = page.get_by_role("button", name="Preview Screen")
        preview_button.click()

        # 3. Wait for the modal to appear
        # We can identify the modal by its heading.
        expect(page.get_by_role("heading", name="Screen Preview")).to_be_visible()

        # 4. Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
