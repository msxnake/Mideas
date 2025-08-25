import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:5173", timeout=15000)
            await expect(page.get_by_text("Project Assets")).to_be_visible(timeout=15000)

            # 1. Create a new Game Flow asset
            await page.get_by_role("button", name="New Asset").click()
            # The dropdown item for asset creation, inside the absolute positioned dropdown
            await page.locator("div.absolute").get_by_role("button", name="Game Flow").click()

            # 2. Add a Submenu node
            await page.get_by_role("button", name="Add Submenu").click()
            await expect(page.locator("svg").get_by_text("SubMenu", exact=True)).to_be_visible()

            # 3. Add an End node
            await page.get_by_role("button", name="Add End").click()
            await expect(page.locator("svg").get_by_text("End", exact=True)).to_be_visible()

            # 4. Select the Submenu node and edit its properties
            await page.locator("g:has-text('SubMenu') rect:first-of-type").click()
            properties_panel = page.get_by_role("heading", name="Game Flow Node Properties").locator('..')
            await expect(properties_panel).to_be_visible()

            title_input = properties_panel.get_by_label("Title:")
            await title_input.fill("Nivel 1 Completo")
            await expect(page.get_by_text("Nivel 1 Completo")).to_be_visible()

            # 5. Add a new option
            await properties_panel.get_by_role("button", name="Add Option").click()
            option_inputs = await properties_panel.get_by_label("Options:").locator('input').all()
            await option_inputs[1].fill("Continuar")

            # 6. Select the End node and edit its properties
            await page.locator("g:has-text('End') rect:first-of-type").click()
            await expect(properties_panel).to_be_visible()

            await properties_panel.get_by_label("End Type:").select_option("GameOver")
            await expect(page.get_by_text("GameOver")).to_be_visible()

            # 7. Take final screenshot
            await page.screenshot(path="jules-scratch/verification/final_game_flow.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            # Save a screenshot on error for debugging
            await page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        finally:
            await browser.close()

asyncio.run(main())
