const fs = require('fs');
const puppeteer = require('puppeteer');
const crawler = require('./crawler');
const cols = require('./cols');

const fetchMineralInfo = async (mineral) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  await Promise.all([
    page.waitForNavigation(),
    await page.goto(`https://zh.mindat.org/search.php?search=${mineral}`),
  ]);

  const data = await page.evaluate(crawler);

  await browser.close();

  return data;
};

const main = async () => {
  let res = [cols];
  let mineralList;

  try {
    mineralList = fs.readFileSync('./mineralList.txt', 'utf-8').split('\n');
  } catch (err) {
    throw new Error(err);
  }

  for (let i = 0, len = mineralList.length; i < 3; i++) {
    const mineral = mineralList[i];
    const data = await fetchMineralInfo(mineral);
    res.push(data);
  }

  console.log('====================================');
  console.log(res);
  console.log('====================================');
};

main();
