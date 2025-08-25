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

            # 4. Connect the Submenu to the End node
            await submenu_node_locator.locator("rect[fill='hsl(50, 80%, 60%)']").click()
            await end_node_locator.locator("rect[fill='hsl(200, 80%, 60%)']").click()
            await expect(page.locator("[data-testid^=connection-]")).to_be_visible()

            # 5. Right-click the Submenu node to open the context menu
            await submenu_node_locator.click(button="right")

            # 6. Click the "Delete Node" option
            await page.get_by_role("button", name="Delete Node").click()

            # 7. Verify both nodes are gone
            await expect(submenu_node_locator).not_to_be_visible()
            await expect(end_node_locator).not_to_be_visible()

            # 8. Take a screenshot for verification
            await page.screenshot(path="jules-scratch/verification/cascading_delete.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        finally:
            await browser.close()

asyncio.run(main())
