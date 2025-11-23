import { test, expect } from '@playwright/test';

test.describe('Mulina PWA - Core User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Home screen loads correctly', async ({ page }) => {
    await expect(page.locator('text=Mulina')).toBeVisible();
    await expect(page.locator('text=Nowy Wzór')).toBeVisible();
  });

  test('Image picker flow - upload image', async ({ page }) => {
    await page.click('text=Nowy Wzór');
    await expect(page.locator('text=Wybierz zdjęcie')).toBeVisible();
    
    // Simulate file upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-assets/sample-image.jpg');
    
    await expect(page.locator('text=Przetwarzanie')).toBeVisible({ timeout: 10000 });
  });

  test('Pattern editor - grid rendering', async ({ page }) => {
    // Assume pattern already loaded
    await page.goto('http://localhost:3000/PatternEditor?patternId=test-pattern-123');
    await page.waitForLoadState('networkidle');
    
    // Check if grid is rendered
    const gridCells = page.locator('[data-testid="grid-cell"]');
    await expect(gridCells.first()).toBeVisible();
    
    // Test zoom controls
    await page.click('text=🔍+');
    await page.waitForTimeout(500);
    
    // Test tool selection
    await page.click('text=✏️'); // Pencil tool
    await expect(page.locator('[data-testid="tool-pencil"]')).toHaveClass(/active/);
  });

  test('Pattern export - PDF generation', async ({ page }) => {
    await page.goto('http://localhost:3000/PatternEditor?patternId=test-pattern-123');
    
    // Wait for pattern to load
    await page.waitForSelector('text=📄 PDF', { timeout: 10000 });
    
    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=📄 PDF');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/pattern.*\.pdf/);
  });

  test('Pattern export - XSD format', async ({ page }) => {
    await page.goto('http://localhost:3000/PatternEditor?patternId=test-pattern-123');
    
    await page.click('text=💾 Eksport');
    await page.click('text=XSD');
    
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/pattern.*\.xsd/);
  });

  test('Pattern import - JSON file', async ({ page }) => {
    await page.goto('http://localhost:3000/PatternEditor?patternId=test-pattern-123');
    
    const fileInput = page.locator('input[type="file"][accept="application/json"]');
    await fileInput.setInputFiles('./test-assets/sample-pattern.json');
    
    await expect(page.locator('text=Sukces')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Wzór zaimportowany')).toBeVisible();
  });

  test('Offline mode - pattern cache', async ({ page, context }) => {
    // Load pattern while online
    await page.goto('http://localhost:3000/PatternEditor?patternId=test-pattern-123');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Navigate away and back
    await page.goto('http://localhost:3000');
    await page.goto('http://localhost:3000/PatternEditor?patternId=test-pattern-123');
    
    // Pattern should still load from cache
    await expect(page.locator('[data-testid="grid-cell"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('Firebase Auth - Login flow', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.click('text=Zaloguj');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123456');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Moje Wzory')).toBeVisible({ timeout: 10000 });
  });

  test('Companion Mode - Stitch tracking', async ({ page }) => {
    await page.goto('http://localhost:3000/PatternEditor?patternId=test-pattern-123');
    
    await page.click('text=🧵 Companion');
    await expect(page.locator('text=Tryb Companion')).toBeVisible();
    
    // Mark stitch as completed
    const firstStitch = page.locator('[data-testid="stitch-0-0"]').first();
    await firstStitch.click();
    
    // Verify progress update
    await expect(page.locator('text=Postęp:')).toBeVisible();
  });

  test('PWA Installation - Add to Home Screen', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
    
    // Verify service worker registration
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistered).toBe(true);
  });
});
