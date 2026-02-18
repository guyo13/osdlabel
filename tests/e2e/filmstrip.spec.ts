import { test, expect } from '@playwright/test';

test.describe('Filmstrip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="filmstrip"]', { timeout: 10000 });
  });

  test('should display all available images', async ({ page }) => {
    await expect(page.getByTestId('filmstrip-item-highsmith')).toBeVisible();
    await expect(page.getByTestId('filmstrip-item-duomo')).toBeVisible();
    await expect(page.getByTestId('filmstrip-item-wide')).toBeVisible();
    await expect(page.getByTestId('filmstrip-item-jpg')).toBeVisible();
  });

  test('should assign image to active cell on click', async ({ page }) => {
    // Cell 0 starts with Highsmith. Click Duomo to change it.
    await page.getByTestId('filmstrip-item-duomo').click();

    // Verify no placeholder (image was assigned)
    await expect(page.locator('text=Assign an image')).toHaveCount(0);
  });

  test('should highlight assigned images', async ({ page }) => {
    // Highsmith is assigned to cell 0, so it should have a highlighted border
    const highsmithItem = page.getByTestId('filmstrip-item-highsmith');
    const border = await highsmithItem.evaluate(el => getComputedStyle(el).borderColor);
    // The assigned image should have the blue highlight border
    expect(border).toContain('rgb(33, 150, 243)'); // #2196F3
  });

  test('should assign different images to different cells', async ({ page }) => {
    // Expand to 2x1
    await page.getByTestId('grid-selector-trigger').click();
    await page.getByTestId('grid-cell-2-1').click();

    // Click the empty cell to make it active
    await page.locator('text=Assign an image').first().click();

    // Assign Duomo to the second cell
    await page.getByTestId('filmstrip-item-duomo').click();

    // Both cells should now have images
    await expect(page.locator('text=Assign an image')).toHaveCount(0);

    // Both Highsmith and Duomo should now be highlighted
    const highsmithBorder = await page.getByTestId('filmstrip-item-highsmith').evaluate(
      el => getComputedStyle(el).borderColor
    );
    const duomoBorder = await page.getByTestId('filmstrip-item-duomo').evaluate(
      el => getComputedStyle(el).borderColor
    );
    expect(highsmithBorder).toContain('rgb(33, 150, 243)');
    expect(duomoBorder).toContain('rgb(33, 150, 243)');
  });
});
