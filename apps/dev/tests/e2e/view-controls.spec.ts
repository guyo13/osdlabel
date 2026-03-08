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

  test('Rotate CW/CCW updates view and reset clears it', async ({ page }) => {
    // Click rotate-cw — rotation label should appear
    await page.getByTestId('view-rotate-cw').click();
    // A 90° label should appear
    await expect(page.locator('text=90°')).toBeVisible();

    // Click rotate-cw again
    await page.getByTestId('view-rotate-cw').click();
    await expect(page.locator('text=180°')).toBeVisible();

    // Click rotate-ccw to go back to 90°
    await page.getByTestId('view-rotate-ccw').click();
    await expect(page.locator('text=90°')).toBeVisible();

    // Click reset — rotation label should disappear
    await page.getByTestId('view-reset').click();
    await expect(page.locator('text=90°')).not.toBeVisible();
  });

  test('Flip buttons toggle and show active state', async ({ page }) => {
    const flipH = page.getByTestId('view-flip-h');

    // Initially not active (background should be #333)
    await expect(flipH).toHaveCSS('background-color', 'rgb(51, 51, 51)');

    // Click flip-h — should show active style
    await flipH.click();
    await expect(flipH).toHaveCSS('background-color', 'rgb(33, 150, 243)');

    // Click again — should return to inactive
    await flipH.click();
    await expect(flipH).toHaveCSS('background-color', 'rgb(51, 51, 51)');
  });

  test('Reset clears rotation and flip', async ({ page }) => {
    // Apply rotation + flip
    await page.getByTestId('view-rotate-cw').click();
    await page.getByTestId('view-flip-h').click();

    // Reset
    await page.getByTestId('view-reset').click();

    // Flip button should be inactive
    await expect(page.getByTestId('view-flip-h')).toHaveCSS(
      'background-color',
      'rgb(51, 51, 51)',
    );
    // No rotation label
    await expect(page.locator('text=90°')).not.toBeVisible();
  });

  test('Keyboard shortcuts for view transforms', async ({ page }) => {
    // Shift+R should rotate CW
    await page.keyboard.press('Shift+R');
    await expect(page.locator('text=90°')).toBeVisible();

    // Shift+H should flip horizontal
    await page.keyboard.press('Shift+H');
    await expect(page.getByTestId('view-flip-h')).toHaveCSS(
      'background-color',
      'rgb(33, 150, 243)',
    );

    // Plain 'r' should still activate rectangle tool (not rotate)
    await page.getByRole('combobox').selectOption({ label: 'General' });
    await page.keyboard.press('r');
    await expect(page.getByTestId('status-tool')).toContainText('Rectangle');
  });
});
