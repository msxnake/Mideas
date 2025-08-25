from playwright.sync_api import sync_playwright, Page, expect

def verify_game_flow(page: Page):
    """
    This script verifies the new Game Flow editor.
    """
    page.goto("http://localhost:5173")
    expect(page.get_by_text("Project Assets")).to_be_visible()

    # Open the Game Flow editor
    page.get_by_role("button", name="Game Flow").click()
    expect(page.get_by_text("Game Flow Editor Canvas")).to_be_visible()

    # The root node should be visible
    root_node = page.get_by_text("Iniciar Partida")
    expect(root_node).to_be_visible()

    # Link root node to a submenu
    page.get_by_role("button", name="Link SubMenu").click()

    # Add two options to the submenu
    add_option_button = page.get_by_role("button", name="Add Option")
    expect(add_option_button).to_be_visible()
    add_option_button.click()
    add_option_button.click()

    page.wait_for_timeout(500)

    page.screenshot(path="jules-scratch/verification/game_flow_editor.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_game_flow(page)
        browser.close()

if __name__ == "__main__":
    main()
