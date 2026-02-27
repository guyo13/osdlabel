from playwright.sync_api import sync_playwright

def verify_grid_controls():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            # Navigate to the app
            print("Navigating to app...")
            page.goto("http://localhost:5173")

            # Wait for the grid controls to be visible
            # The trigger button has data-testid="grid-selector-trigger"
            print("Waiting for grid controls...")
            grid_trigger = page.locator('[data-testid="grid-selector-trigger"]')
            grid_trigger.wait_for(state="visible", timeout=10000)

            # Take a screenshot of the initial state
            print("Taking initial screenshot...")
            page.screenshot(path="verification_initial.png")

            # Click the trigger to open the popover
            print("Opening grid selector...")
            grid_trigger.click()

            # Wait for popover to appear
            popover = page.locator('[data-testid="grid-selector-popover"]')
            popover.wait_for(state="visible", timeout=2000)

            # Hover over a cell (e.g., 2x2)
            print("Hovering over cell 2x2...")
            cell_2_2 = page.locator('[data-testid="grid-cell-2-2"]')
            cell_2_2.hover()

            # Take a screenshot of the open state with hover
            print("Taking open state screenshot...")
            page.screenshot(path="verification_open.png")

            print("Verification script completed successfully.")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification_error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_grid_controls()
