import { test, expect } from '@playwright/test';

test.describe('View Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="tool-navigate"]', { timeout: 10000 });
  });

  test('View control buttons are visible', async ({ page }) => {
    await expect(page.getByTestId('view-rotate-cw')).toBeVisible();
    await expect(page.getByTestId('view-rotate-ccw')).toBeVisible();
    await expect(page.getByTestId('view-flip-h')).toBeVisible();
    await expect(page.getByTestId('view-flip-v')).toBeVisible();
    await expect(page.getByTestId('view-reset')).toBeVisible();
  });

  test('Rotate CW/CCW updates view', async ({ page }) => {
    // Click rotate CW
    await page.getByTestId('view-rotate-cw').click();
    // Rotation label should appear showing 90°
    await expect(page.getByTestId('view-rotation-label')).toContainText('90°');

    // Click rotate CW again
    await page.getByTestId('view-rotate-cw').click();
    await expect(page.getByTestId('view-rotation-label')).toContainText('180°');

    // Click rotate CCW to go back to 90°
    await page.getByTestId('view-rotate-ccw').click();
    await expect(page.getByTestId('view-rotation-label')).toContainText('90°');

    // Click reset
    await page.getByTestId('view-reset').click();
    // Rotation label should disappear at 0°
    await expect(page.getByTestId('view-rotation-label')).not.toBeVisible();
  });

  test('Flip buttons toggle and show active state', async ({ page }) => {
    const flipH = page.getByTestId('view-flip-h');

    // Get initial background color
    const initialBg = await flipH.evaluate((el) => getComputedStyle(el).backgroundColor);

    // Click flip H — should toggle to active state
    await flipH.click();
    const activeBg = await flipH.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(activeBg).not.toBe(initialBg);

    // Click flip H again — should return to inactive
    await flipH.click();
    const revertedBg = await flipH.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(revertedBg).toBe(initialBg);
  });

  test('Reset clears rotation and flip', async ({ page }) => {
    // Apply rotation
    await page.getByTestId('view-rotate-cw').click();
    await expect(page.getByTestId('view-rotation-label')).toContainText('90°');

    // Apply flip
    await page.getByTestId('view-flip-h').click();

    // Reset
    await page.getByTestId('view-reset').click();

    // Rotation label should be gone
    await expect(page.getByTestId('view-rotation-label')).not.toBeVisible();

    // Flip button should be back to inactive state
    const flipH = page.getByTestId('view-flip-h');
    const bg = await flipH.evaluate((el) => getComputedStyle(el).backgroundColor);
    // #333 = rgb(51, 51, 51) for inactive
    expect(bg).toBe('rgb(51, 51, 51)');
  });

  test('Keyboard shortcuts for view transforms', async ({ page }) => {
    // Switch to 'General' context to enable all tools
    await page.getByRole('combobox').selectOption({ label: 'General' });

    // Shift+R should rotate CW
    await page.keyboard.press('Shift+R');
    await expect(page.getByTestId('view-rotation-label')).toContainText('90°');

    // Shift+L should rotate CCW back to 0°
    await page.keyboard.press('Shift+L');
    await expect(page.getByTestId('view-rotation-label')).not.toBeVisible();

    // Shift+H should flip horizontal
    await page.keyboard.press('Shift+H');
    const flipH = page.getByTestId('view-flip-h');
    const activeBg = await flipH.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Should be active (#2196F3 = rgb(33, 150, 243))
    expect(activeBg).toBe('rgb(33, 150, 243)');

    // Plain 'r' should still activate rectangle tool (not rotate)
    await page.keyboard.press('r');
    await expect(page.getByTestId('status-tool')).toContainText('Rectangle');
  });
});
