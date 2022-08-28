const fs = require('fs');
const { Cluster } = require('puppeteer-cluster');

const { linkCrawler, locCrawler } = require('./crawler');
const json2csv = require('./json2csv');
const cols = require('./cols');

process.setMaxListeners(0);

const options = {
  concurrency: Cluster.CONCURRENCY_PAGE,
  maxConcurrency: 8,
  timeout: 24 * 60 * 60 * 1000,
  monitor: true,
  retryDelay: 1000,
  puppeteerOptions: {
    // headless: false,
    // timeout: 24 * 60 * 60 * 1000,
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
      '--single-process',
    ],
  },
};

const initialPage = async (page) => {
  // 拦截请求
  await page.setRequestInterception(true);

  page.on('request', (req) => {
    // 根据请求类型过滤
    const resourceType = req.resourceType();
    if (resourceType === 'image') {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.setDefaultNavigationTimeout(0);
};

const fetchAllLinks = async (mineralList) => {
  const links = [];
  const cluster = await Cluster.launch(options);

  await cluster.task(async ({ page, data: { url, name } }) => {
    await await initialPage(page);

    await Promise.all([page.waitForNavigation(), await page.goto(url)]);

    await page.evaluateOnNewDocument(() => {
      const newProto = navigator.__proto__;
      delete newProto.webdriver;
      navigator.__proto__ = newProto;
    });

    const locLinks = await page.evaluate(linkCrawler);

    links.push({ name, locLinks });
  });

  const num = 0;

  for (let i = num, len = num + 10; i < len; i++) {
    const mineral = mineralList[i];
    cluster.queue({
      url: `https://zh.mindat.org/search.php?search=${mineral}`,
      name: mineral,
    });
  }

  await cluster.idle();
  await cluster.close();

  return links;
};

const fetchLocationInfo = async (links) => {
  const rows = [];
  const cluster = await Cluster.launch(options);

  await cluster.task(async ({ page, data: { url, name } }) => {
    await initialPage(page);

    await Promise.all([page.waitForNavigation(), await page.goto(url)]);

    const infos = await page.evaluate(locCrawler);
    rows.push([name, ...infos]);
  });

  const num = 0;

  for (let i = num, total = links.length; i < total; i++) {
    const { name, locLinks } = links[i];
    for (let j = 0, len = locLinks.length; j < len; j++) {
      const url = locLinks[j];

      cluster.queue({
        url,
        name,
      });
    }
  }

  await cluster.idle();
  await cluster.close();

  return rows;
};

const main = async () => {
  let mineralList;

  try {
    mineralList = fs.readFileSync('./mineralList.txt', 'utf-8').split('\n');
  } catch (err) {
    throw new Error(err);
  }

  const links = await fetchAllLinks(mineralList);
  const rows = await fetchLocationInfo(links);

  json2csv([cols, ...rows]);
};

main();
