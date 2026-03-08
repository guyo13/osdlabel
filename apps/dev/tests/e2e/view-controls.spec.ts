import { test, expect } from '@playwright/test';

test.describe('View Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for OSD to initialize
    await page.waitForSelector('.openseadragon-container');
  });

  test('View control buttons are visible', async ({ page }) => {
    await expect(page.getByTestId('view-rotate-cw')).toBeVisible();
    await expect(page.getByTestId('view-rotate-ccw')).toBeVisible();
    await expect(page.getByTestId('view-flip-h')).toBeVisible();
    await expect(page.getByTestId('view-flip-v')).toBeVisible();
    await expect(page.getByTestId('view-reset')).toBeVisible();
  });

  test('Rotate CW/CCW updates view', async ({ page }) => {
    const rotateCw = page.getByTestId('view-rotate-cw');
    const rotateCcw = page.getByTestId('view-rotate-ccw');
    const reset = page.getByTestId('view-reset');

    // Initial state: no rotation label
    await expect(page.getByText('90°')).not.toBeVisible();

    await rotateCw.click();
    await expect(page.getByText('90°')).toBeVisible();

    await rotateCw.click();
    await expect(page.getByText('180°')).toBeVisible();

    await rotateCcw.click();
    await expect(page.getByText('90°')).toBeVisible();

    await reset.click();
    await expect(page.getByText('90°')).not.toBeVisible();
  });

  test('Flip buttons toggle and show active state', async ({ page }) => {
    const flipH = page.getByTestId('view-flip-h');
    const flipV = page.getByTestId('view-flip-v');

    // Check active state via background color (active is #2196F3)
    await flipH.click();
    const flipHBg = await flipH.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // rgb(33, 150, 243) is #2196F3
    expect(flipHBg).toBe('rgb(33, 150, 243)');

    await flipH.click();
    const flipHBgInactive = await flipH.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(flipHBgInactive).toBe('rgb(51, 51, 51)'); // #333
  });

  test('Keyboard shortcuts for view transforms', async ({ page }) => {
    // Shift+R for Rotate CW
    await page.keyboard.press('Shift+R');
    await expect(page.getByText('90°')).toBeVisible();

    // Shift+H for Flip H
    await page.keyboard.press('Shift+H');
    const flipH = page.getByTestId('view-flip-h');
    const flipHBg = await flipH.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(flipHBg).toBe('rgb(33, 150, 243)');

    // Shift+0 (represented as ')' in some locales, but Playwright handles it)
    await page.keyboard.press('Shift+0');
    await expect(page.getByText('90°')).not.toBeVisible();
    const flipHBgReset = await flipH.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(flipHBgReset).toBe('rgb(51, 51, 51)');
  });

  test('Plain "r" still activates rectangle tool (no interference)', async ({ page }) => {
    await page.keyboard.press('r');
    
    // Check if rectangle tool is active
    const rectTool = page.getByTestId('tool-rectangle');
    const rectToolBg = await rectTool.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(rectToolBg).toBe('rgb(33, 150, 243)');
    
    // Ensure no rotation happened
    await expect(page.getByText('90°')).not.toBeVisible();
  });
});
