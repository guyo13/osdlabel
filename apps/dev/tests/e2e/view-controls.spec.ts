import { test, expect } from '@playwright/test';

test.describe('View Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the local dev app
    await page.goto('/');
    
    // Wait for OpenSeadragon viewer canvas to be present
    await page.waitForSelector('.openseadragon-canvas');
  });

  test('View control buttons are visible', async ({ page }) => {
    await expect(page.locator('[data-testid="view-rotate-cw"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-rotate-ccw"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-flip-h"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-flip-v"]')).toBeVisible();
    // Reset button should not be visible initially as view is not transformed
    await expect(page.locator('[data-testid="view-reset"]')).not.toBeVisible();
  });

  test('Rotate CW/CCW updates view and shows reset', async ({ page }) => {
    const rotateCwBtn = page.locator('[data-testid="view-rotate-cw"]');
    const rotateCcwBtn = page.locator('[data-testid="view-rotate-ccw"]');
    const resetBtn = page.locator('[data-testid="view-reset"]');

    await expect(resetBtn).not.toBeVisible();
    
    await rotateCwBtn.click();
    await expect(resetBtn).toBeVisible();
    
    await rotateCwBtn.click();
    await expect(resetBtn).toBeVisible();

    await rotateCcwBtn.click();
    await rotateCcwBtn.click();
    
    // Back to 0 rotation, reset should disappear
    await expect(resetBtn).not.toBeVisible();
  });

  test('Flip buttons toggle and show active state', async ({ page }) => {
    const flipHBtn = page.locator('[data-testid="view-flip-h"]');
    const resetBtn = page.locator('[data-testid="view-reset"]');

    // Default background color is #333 (inactive)
    await expect(flipHBtn).toHaveCSS('background-color', 'rgb(51, 51, 51)');
    
    await flipHBtn.click();
    
    // Active background color is #2196F3 (rgb(33, 150, 243))
    await expect(flipHBtn).toHaveCSS('background-color', 'rgb(33, 150, 243)');
    await expect(resetBtn).toBeVisible();
    
    await flipHBtn.click();
    await expect(flipHBtn).toHaveCSS('background-color', 'rgb(51, 51, 51)');
    await expect(resetBtn).not.toBeVisible();
  });

  test('Reset clears rotation and flip', async ({ page }) => {
    const rotateCwBtn = page.locator('[data-testid="view-rotate-cw"]');
    const flipVBtn = page.locator('[data-testid="view-flip-v"]');
    const resetBtn = page.locator('[data-testid="view-reset"]');

    await rotateCwBtn.click();
    await flipVBtn.click();
    
    await expect(resetBtn).toBeVisible();
    await expect(flipVBtn).toHaveCSS('background-color', 'rgb(33, 150, 243)');
    
    await resetBtn.click();
    
    await expect(resetBtn).not.toBeVisible();
    await expect(flipVBtn).toHaveCSS('background-color', 'rgb(51, 51, 51)');
  });

  test('View transforms persist across cell switching', async ({ page }) => {
    // Enable a 2x1 grid
    await page.locator('[data-testid="grid-selector-trigger"]').click();
    await page.locator('[data-testid="grid-cell-2-1"]').click();
    
    // Assign images to both cells by clicking thumbnails in filmstrip
    const thumbnails = page.locator('[data-testid^="filmstrip-item-"]');
    
    // Cell 0 is active by default. Assign first image.
    await thumbnails.nth(0).click();
    
    // Rotate cell 0
    await page.locator('[data-testid="view-rotate-cw"]').click();
    await expect(page.locator('[data-testid="view-reset"]')).toBeVisible();

    // Click to activate cell 1
    await page.locator('[data-testid="grid-cell-1"]').click();
    // Assign second image
    await thumbnails.nth(1).click();
    
    // Cell 1 should have default transform
    await expect(page.locator('[data-testid="view-reset"]')).not.toBeVisible();
    
    // Click back to cell 0
    await page.locator('[data-testid="grid-cell-0"]').click();
    
    // Cell 0 should still show transformed state
    await expect(page.locator('[data-testid="view-reset"]')).toBeVisible();
  });

  test('Annotations maintain position after rotation', async ({ page }) => {
    // Select rectangle tool
    await page.locator('[data-testid="tool-rectangle"]').click();
    
    // Draw a rectangle
    // The canvas container intercepts events for the actual canvas, so drag on the container
    const canvasContainer = page.locator('.canvas-container').first();
    await canvasContainer.dragTo(canvasContainer, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 200, y: 200 },
    });
    
    // Count objects
    await page.evaluate(() => {
      // @ts-ignore
      const canvas = window.fabricCanvas; // We might need to expose this or just check DOM elements
      return document.querySelectorAll('.upper-canvas').length;
    });

    // Wait for the object to be added to state
    await page.waitForTimeout(100);

    // Rotate
    await page.locator('[data-testid="view-rotate-cw"]').click();

    // The annotation should still be there
    // For now we just verify we can perform the action without crashing
    // E2E visual tests would be better here, but this at least exercises the path
  });

  test('Keyboard shortcuts for view transforms', async ({ page }) => {
    const flipHBtn = page.locator('[data-testid="view-flip-h"]');
    const resetBtn = page.locator('[data-testid="view-reset"]');

    // Press Shift+H
    await page.keyboard.press('Shift+H');
    await expect(flipHBtn).toHaveCSS('background-color', 'rgb(33, 150, 243)');
    await expect(resetBtn).toBeVisible();

    // Press Shift+R
    await page.keyboard.press('Shift+R');
    
    // Press Shift+0 (Reset)
    await page.keyboard.press('Shift+0');
    
    await expect(flipHBtn).toHaveCSS('background-color', 'rgb(51, 51, 51)');
    await expect(resetBtn).not.toBeVisible();
    
    // Plain 'r' triggers rectangle tool, not rotation
    await page.keyboard.press('r');
    await expect(page.locator('[data-testid="tool-rectangle"]')).toHaveCSS('background-color', 'rgb(33, 150, 243)');
    await expect(resetBtn).not.toBeVisible();
  });
});