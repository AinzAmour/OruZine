import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const SCREENSHOT_DIR = path.resolve('./apps/web/e2e/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const TEST_IMAGE_PATH = 'C:\\Users\\AinZ\\Downloads\\Convo Phots\\sel (2).jpeg';
const TEST_IMAGE_2_PATH = 'C:\\Users\\AinZ\\Downloads\\Convo Phots\\sel (4).jpeg';

async function runReviewTest() {
  console.log('🚀 Starting Playwright automated review...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`[Browser Error]: ${msg.text()}`);
    } else {
      console.log(`[Browser Console]: ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error(`[Page Exception]: ${err.message}`);
  });

  try {
    console.log('1️⃣ Navigating to http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_page.png') });
    console.log('📸 Saved 01_landing_page.png');

    console.log('➡️ Clicking "MAKE A ZINE NOW" to open Editor...');
    const startBtn = page
      .locator('text=MAKE A ZINE NOW')
      .or(page.locator('button:has-text("Open Editor")'))
      .first();
    await startBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_initial_editor.png') });
    console.log('📸 Saved 01_initial_editor.png');

    console.log('2️⃣ Uploading test image from Convo Phots...');
    // Find hidden file input for images
    const imageInput = await page.locator('input[type="file"][accept*="image"]');
    await imageInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_image_uploaded.png') });
    console.log('📸 Saved 02_image_uploaded.png');

    console.log('3️⃣ Testing Quick Alignment Bar on Image Object...');
    // Click on the image layer on canvas
    const canvas = page.locator('main').first();
    // Select the newly added object
    const layerItem = page
      .locator('text=Layer 1, image')
      .or(page.locator('button:has-text("image")'))
      .first();
    if (await layerItem.isVisible()) {
      await layerItem.click();
    } else {
      // Click near center of canvas
      await canvas.click({ position: { x: 400, y: 300 } });
    }
    await page.waitForTimeout(500);

    // Look for Quick Alignment Bar
    const alignBar = page.locator('text=ALIGN:');
    const isAlignVisible = await alignBar.isVisible();
    console.log(`Alignment bar visible: ${isAlignVisible}`);

    if (isAlignVisible) {
      // Test "Fit Width"
      const fitWidthBtn = page.locator('button[title="Fit Width"]').first();
      if (await fitWidthBtn.isVisible()) {
        await fitWidthBtn.click();
        await page.waitForTimeout(300);
      }

      // Test "Center Y"
      const centerYBtn = page.locator('button[title="Center Y"]').first();
      if (await centerYBtn.isVisible()) {
        await centerYBtn.click();
        await page.waitForTimeout(300);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_image_aligned.png') });
    console.log('📸 Saved 03_image_aligned.png');

    console.log('4️⃣ Testing Text Creation and Typography...');
    const addTextBtn = page.locator('button:has-text("Add Text")').first();
    await addTextBtn.click();
    await page.waitForTimeout(500);

    // Open right sidebar Inspector typography options
    // Find text textarea or text editor
    const textInput = page.locator('textarea').first();
    if (await textInput.isVisible()) {
      await textInput.fill('CONVO 2026\nZINE EDITION');
    }

    // Toggle Bold
    const boldBtn = page.locator('button[title="Bold"]').first();
    if (await boldBtn.isVisible()) {
      await boldBtn.click();
    }

    // Toggle Italic
    const italicBtn = page.locator('button[title="Italic"]').first();
    if (await italicBtn.isVisible()) {
      await italicBtn.click();
    }

    // Toggle Center Align
    const centerAlignBtn = page.locator('button[title="Center"]').first();
    if (await centerAlignBtn.isVisible()) {
      await centerAlignBtn.click();
    }

    // Align Text Object to Center X & Top using Quick Alignment bar
    const centerXBtn = page.locator('button[title="Center X"]').first();
    if (await centerXBtn.isVisible()) {
      await centerXBtn.click();
    }

    const alignTopBtn = page.locator('button[title="Align Top"]').first();
    if (await alignTopBtn.isVisible()) {
      await alignTopBtn.click();
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_text_typography.png') });
    console.log('📸 Saved 04_text_typography.png');

    console.log('5️⃣ Testing Page 2 Image Upload...');
    // Click Page 2 in sidebar
    const page2Btn = page.locator('button:has-text("Page 2")').first();
    if (await page2Btn.isVisible()) {
      await page2Btn.click();
      await page.waitForTimeout(500);

      // Upload second image
      await imageInput.setInputFiles(TEST_IMAGE_2_PATH);
      await page.waitForTimeout(1000);

      // Center it
      const fitPageBtn = page.locator('button[title="Fit Width"]').first();
      if (await fitPageBtn.isVisible()) {
        await fitPageBtn.click();
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_page2_image.png') });
    console.log('📸 Saved 05_page2_image.png');

    console.log('6️⃣ Testing Flipbook Reader 📖 ...');
    const flipbookTab = page.locator('button:has-text("Flipbook Reader")');
    await flipbookTab.click();
    await page.waitForTimeout(1000);

    // Front Cover View
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_flipbook_cover.png') });
    console.log('📸 Saved 06_flipbook_cover.png');

    // Flip to Next Spread (Inside Spread: Page 2 & Page 3)
    const nextBtn = page
      .locator('button[title*="Next Page"]')
      .or(page.locator('button[title*="Next Spread"]'))
      .first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_flipbook_inside_spread.png') });
      console.log('📸 Saved 07_flipbook_inside_spread.png');
    }

    // Test "Edit Left Page" shortcut
    const editLeftBtn = page.locator('button:has-text("Edit Left Page")');
    if (await editLeftBtn.isVisible()) {
      await editLeftBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_back_to_page_edit.png') });
      console.log('📸 Saved 08_back_to_page_edit.png');
    }

    console.log('7️⃣ Testing Imposed Sheet 🖨️ View ...');
    const imposedTab = page.locator('button:has-text("Imposed Sheet")');
    await imposedTab.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_imposed_sheet.png') });
    console.log('📸 Saved 09_imposed_sheet.png');

    console.log('8️⃣ Testing Export Modal ...');
    const exportBtn = page.locator('button:has-text("Export")').first();
    await exportBtn.click();
    await page.waitForTimeout(800);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_export_modal.png') });
    console.log('📸 Saved 10_export_modal.png');

    // Close export modal
    const closeBtn = page
      .locator('button:has-text("Cancel")')
      .or(page.locator('button[title="Close"]'))
      .first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }

    console.log('🏁 Review finished successfully!');
    if (consoleErrors.length > 0) {
      console.warn(`⚠️ Warning: ${consoleErrors.length} console errors detected:`, consoleErrors);
    } else {
      console.log('✅ ZERO browser errors or unhandled exceptions detected!');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') });
    throw error;
  } finally {
    await browser.close();
  }
}

runReviewTest();
