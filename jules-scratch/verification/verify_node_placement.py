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
            await page.locator("div.absolute").get_by_role("button", name="Game Flow").click()

            # 2. Place a Submenu node
            await page.get_by_role("button", name="Add Submenu").click()
            svg_canvas = page.locator("div.flex-grow.relative.overflow-hidden svg")
            await svg_canvas.hover()
            await page.mouse.move(400, 200)
            await page.mouse.down()
            await page.mouse.up()
            submenu_node_locator = page.locator("g:has-text('Nuevo Menú')")
            await expect(submenu_node_locator).to_be_visible()

            # 3. Place an End node
            await page.get_by_role("button", name="Add End").click()
            await svg_canvas.hover()
            await page.mouse.move(600, 200)
            await page.mouse.down()
            await page.mouse.up()
            end_node_locator = page.locator("g:has-text('Victory')")
            await expect(end_node_locator).to_be_visible()

            # 4. Select the Submenu node and edit its properties
            await submenu_node_locator.click(force=True)
            await page.wait_for_function('() => document.querySelector("h2") && document.querySelector("h2").textContent.includes("Game Flow Node Properties")')

            properties_panel = page.get_by_role("heading", name="Game Flow Node Properties").locator('..')
            await expect(properties_panel).to_be_visible()

            title_input = properties_panel.get_by_label("Title:")
            await title_input.fill("Nivel 1 Completo")
            await expect(page.locator("g:has-text('Nivel 1 Completo')")).to_be_visible()

            # 5. Add a new option
            await properties_panel.get_by_role("button", name="Add Option").click()
            option_inputs = await properties_panel.get_by_label("Options:").locator('input').all()
            await option_inputs[1].fill("Continuar")

            # 6. Select the End node and edit its properties
            await end_node_locator.click(force=True)
            await page.wait_for_function('() => document.querySelector("h2") && document.querySelector("h2").textContent.includes("Game Flow Node Properties")')

            await properties_panel.get_by_label("End Type:").select_option("GameOver")
            await expect(page.locator("g:has-text('GameOver')")).to_be_visible()

            # 7. Drag the End node
            await end_node_locator.hover()
            await page.mouse.down()
            await page.mouse.move(700, 350)
            await page.mouse.up()

            # 8. Take final screenshot
            await page.screenshot(path="jules-scratch/verification/final_game_flow.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        finally:
            await browser.close()

asyncio.run(main())
