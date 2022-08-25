const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.goto('https://zh.mindat.org/');
  await page.type('#searchboxhp', 'Achyrophanite');

  await Promise.all([
    page.waitForNavigation(),
    await page.keyboard.press('Enter'),
  ]);

  await page.screenshot({ path: 'page.png' });

  await browser.close();
})();
