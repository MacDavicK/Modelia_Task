import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123',
};

test.describe('Full User Flow', () => {
  test('complete flow: signup -> login -> generate -> view history -> restore', async ({
    page,
  }) => {
    // Step 1: Visit app
    await page.goto('/');
    await page.screenshot({ path: 'screenshots/01-homepage.png' });

    // Step 2: Navigate to signup
    await page.click('text=Sign Up');
    await page.waitForURL('**/signup');
    await page.screenshot({ path: 'screenshots/02-signup-page.png' });

    // Step 3: Signup
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Sign Up")');
    
    // Wait for redirect to studio
    await page.waitForURL('**/studio', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/03-after-signup.png' });

    // Step 4: Upload image
    // Create a minimal valid JPEG file buffer
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    const jpegBody = Buffer.alloc(1000, 0);
    const testImageBuffer = Buffer.concat([jpegHeader, jpegBody]);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: testImageBuffer,
    });

    // Wait for file to be processed
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/04-image-uploaded.png' });

    // Step 5: Enter prompt
    const promptTextarea = page.locator('textarea[id="prompt"]');
    await promptTextarea.fill('A futuristic fashion model in a neon city with cyberpunk aesthetics');
    await page.screenshot({ path: 'screenshots/05-prompt-filled.png' });

    // Step 6: Select style
    const styleSelect = page.locator('select[id="style"]');
    await styleSelect.selectOption('Artistic');
    await page.screenshot({ path: 'screenshots/06-style-selected.png' });

    // Step 7: Generate (with retry logic for "Model overloaded" errors)
    const generateButton = page.locator('button:has-text("Generate")');
    await generateButton.click();

    // Wait for loading state
    await page.waitForSelector('text=Generating...', { timeout: 2000 }).catch(() => {});
    await page.screenshot({ path: 'screenshots/07-generating.png' });

    // Handle potential "Model overloaded" error with retry
    let maxRetries = 3;
    let retryCount = 0;
    let generationSuccess = false;

    while (retryCount < maxRetries && !generationSuccess) {
      // Wait for either success or error
      try {
        // Check for error message
        const errorMessage = page.locator('text=/Model overloaded/i');
        const isErrorVisible = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

        if (isErrorVisible) {
          await page.screenshot({ path: `screenshots/08-error-overloaded-${retryCount + 1}.png` });
          
          if (retryCount < maxRetries - 1) {
            // Wait a bit before retrying
            await page.waitForTimeout(2000);
            
            // Click retry button if available, or click generate again
            const retryButton = page.locator('button:has-text("Retry")');
            const retryButtonVisible = await retryButton.isVisible({ timeout: 1000 }).catch(() => false);
            
            if (retryButtonVisible) {
              await retryButton.click();
            } else {
              // If no retry button, click generate again
              await generateButton.click();
            }
            
            retryCount++;
            continue;
          } else {
            // Max retries reached
            throw new Error('Model overloaded after maximum retries');
          }
        }

        // Check for success (result image appears)
        await page.waitForSelector('img[alt="Generated image"], img[alt="Generated"]', {
          timeout: 10000,
        });
        generationSuccess = true;
        await page.screenshot({ path: 'screenshots/09-generation-success.png' });
      } catch (error) {
        // If timeout, check if we're still loading or if there's an error
        const stillLoading = await page.locator('text=Generating...').isVisible({ timeout: 1000 }).catch(() => false);
        if (!stillLoading) {
          // Not loading, check for other errors
          const hasError = await page.locator('text=/error|failed/i').isVisible({ timeout: 1000 }).catch(() => false);
          if (hasError && retryCount < maxRetries - 1) {
            retryCount++;
            await page.waitForTimeout(2000);
            await generateButton.click();
            continue;
          }
        }
        throw error;
      }
    }

    // Verify result is displayed
    await expect(page.locator('text=/A futuristic fashion model/i')).toBeVisible();
    await expect(page.locator('text=Artistic')).toBeVisible();

    // Step 8: View history
    // Scroll to history section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/10-history-section.png' });

    // Verify generation appears in history
    // Look for images in the history section
    const historySection = page.locator('text=Recent Generations').locator('..');
    const historyImages = historySection.locator('img');
    await expect(historyImages.first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/11-history-with-item.png' });

    // Step 9: Restore from history
    // Click on the first history item (the card containing the image)
    const firstHistoryCard = historySection.locator('div').filter({ has: historyImages.first() }).first();
    await firstHistoryCard.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/12-restored-from-history.png' });

    // Verify form is populated with history data
    const promptValue = await promptTextarea.inputValue();
    expect(promptValue).toContain('futuristic fashion model');
    
    const styleValue = await styleSelect.inputValue();
    expect(styleValue).toBe('Artistic');
  });

  test('login flow and generate', async ({ page }) => {
    // First, create a user via signup
    await page.goto('/signup');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Sign Up")');
    await page.waitForURL('**/studio', { timeout: 10000 });

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/13-logout-complete.png' });

    // Login
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Login")');
    await page.waitForURL('**/studio', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/14-login-success.png' });

    // Verify we're on studio page
    await expect(page.locator('text=/AI Image Generation Studio/i')).toBeVisible();
  });

  test('error handling and retry mechanism', async ({ page }) => {
    // Signup/login
    await page.goto('/signup');
    await page.fill('input[type="email"]', `retry-test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Sign Up")');
    await page.waitForURL('**/studio', { timeout: 10000 });

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(1000).fill(0)]),
    });

    // Fill form
    await page.fill('textarea[id="prompt"]', 'Test prompt for error handling');
    await page.selectOption('select[id="style"]', 'Realistic');

    // Generate and handle errors
    await page.click('button:has-text("Generate")');

    // Monitor for errors and retries
    let errorOccurred = false;
    let retryAttempted = false;

    // Wait up to 30 seconds for either success or error
    try {
      await Promise.race([
        page.waitForSelector('img[alt="Generated image"], img[alt="Generated"]', { timeout: 30000 }),
        page.waitForSelector('text=/Model overloaded/i', { timeout: 30000 }),
      ]);

      const hasError = await page.locator('text=/Model overloaded/i').isVisible({ timeout: 1000 }).catch(() => false);
      
      if (hasError) {
        errorOccurred = true;
        await page.screenshot({ path: 'screenshots/15-error-detected.png' });

        // Check if retry button is available
        const retryButton = page.locator('button:has-text("Retry")');
        const canRetry = await retryButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (canRetry) {
          await retryButton.click();
          retryAttempted = true;
          await page.screenshot({ path: 'screenshots/16-retry-clicked.png' });

          // Wait for retry result
          await page.waitForSelector('img[alt="Generated image"], img[alt="Generated"], text=/Model overloaded/i', {
            timeout: 15000,
          });
        }
      }
    } catch (error) {
      // Timeout - take screenshot of current state
      await page.screenshot({ path: 'screenshots/17-timeout-state.png' });
    }

    // Verify we handled the error scenario
    expect(errorOccurred || retryAttempted).toBeTruthy();
  });
});

