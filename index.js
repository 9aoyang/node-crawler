const fs = require('fs');
const { Cluster } = require('puppeteer-cluster');

const {
  mineralLinkCrawler,
  cardLinkCrawler,
  infoLinkCrawler,
  infoDetailCrawler,
} = require('./crawler');
const json2csv = require('./json2csv');
const cols = require('./cols');

process.setMaxListeners(0);

const options = {
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  maxConcurrency: 12,
  monitor: true,
  retryDelay: 1000,
  puppeteerOptions: {
    args: [
      '--disable-web-security',
      '--disable-xss-auditor',
      '--disable-webgl',
      '--disable-gpu', // GPU硬件加速
      '--disable-dev-shm-usage', // 创建临时文件共享内存
      '--disable-setuid-sandbox', // uid沙盒
      '--no-first-run', // 没有设置首页。在启动的时候，就会打开一个空白页面。
      '--no-sandbox', // 沙盒模式
      '--no-zygote',
      // '--single-process',
    ],
  },
};

const initialPage = async (page) => {
  await page.setDefaultNavigationTimeout(0);
};

const fetchMineralLinks = async () => {
  let mineralLinks;
  const cluster = await Cluster.launch(options);

  await cluster.task(async ({ page, data: { url } }) => {
    await initialPage(page);

    await Promise.all([page.waitForNavigation(), await page.goto(url)]);

    mineralLinks = await page.evaluate(mineralLinkCrawler);
  });

  cluster.queue({
    url: 'http://database.iem.ac.ru/mincryst/s_lattice.php',
  });

  await cluster.idle();
  await cluster.close();

  return mineralLinks;
};

const fetchCardLinks = async (links) => {
  let cardLinks = [];
  const cluster = await Cluster.launch(options);

  await cluster.task(async ({ page, data: { url, name } }) => {
    await initialPage(page);

    await Promise.all([page.waitForNavigation(), await page.goto(url)]);

    const links = await page.evaluate(cardLinkCrawler);

    for (let i = 0, len = links.length; i < len; i++) {
      cardLinks.push([name, links[i]]);
    }
  });

  for (let i = 0, len = 10; i < len; i++) {
    const [name, url] = links[i];
    cluster.queue({
      url,
      name,
    });
  }

  await cluster.idle();
  await cluster.close();

  return cardLinks;
};

const fetchCardInfos = async (cardLinks) => {
  let rows = [];
  const cluster = await Cluster.launch(options);

  await cluster.task(async ({ page, data: { url, name } }) => {
    await initialPage(page);

    await Promise.all([page.waitForNavigation(), await page.goto(url)]);

    const colLinks = await page.evaluate(infoLinkCrawler);

    let infos = [];
    for (let i = 0, len = colLinks.length; i < len; i++) {
      const url = colLinks[i];
      await Promise.all([page.waitForNavigation(), await page.goto(url)]);
      const info = await page.evaluate(infoDetailCrawler);
      infos.push(info);
    }

    rows.push([name, ...infos]);
  });

  for (let i = 0, len = cardLinks.length; i < len; i++) {
    const [name, url] = cardLinks[i];

    cluster.queue({
      url,
      name,
    });
  }

  await cluster.idle();
  await cluster.close();

  return rows;
};

const main = async () => {
  const mineralLinks = await fetchMineralLinks();
  const cardLinks = await fetchCardLinks(mineralLinks);
  const rows = await fetchCardInfos(cardLinks);

  // Text length must not exceed 32767 characters
  // json2csv([cols, ...rows]);

  const json = rows.reduce((acc, cur) => {
    const genItem = (item) => ({
      [cols[1]]: item[0],
      [cols[2]]: item[1],
      [cols[3]]: item[2],
    });
    const [name, ...infos] = cur;
    if (!acc.get(name)) {
      acc.set(name, [genItem(infos)]);
    } else {
      acc.set(name, [...acc.get(name), genItem(infos)]);
    }

    return acc;
  }, new Map());

  console.log('====================================');
  console.log(json);
  console.log('====================================');
};;;;;

main();
