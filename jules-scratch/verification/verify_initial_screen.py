from playwright.sync_api import sync_playwright, Page, expect

def run(page: Page):
    page.goto("http://localhost:5173")
    expect(page).to_have_title("MSX Retro Game IDE")
    page.screenshot(path="jules-scratch/verification/initial_screen.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        run(page)
        browser.close()

if __name__ == "__main__":
    main()
