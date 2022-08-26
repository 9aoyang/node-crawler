const fs = require('fs');
const { Cluster } = require('puppeteer-cluster');

const crawler = require('./crawler');
const json2csv = require('./json2csv');
const cols = require('./cols');

process.setMaxListeners(0);

const fetchMineralListInfo = async (mineralList) => {
  const rows = [];
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 40,
    timeout: 24 * 60 * 60 * 1000,
    puppeteerOptions: {
      // headless: false,
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
      ],
    },
  });

  await cluster.task(async ({ page, data: { url, index, total, name } }) => {
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

    await Promise.all([page.waitForNavigation(), await page.goto(url)]);
    // await page.screenshot({ path: '1.png' });

    const details = await page.evaluate(crawler);
    rows.push([name, ...details]);

    console.log(`任务 ${index} 完成, 共 ${total} 个任务`);
  });

  const num = 5100;

  for (let i = num, len = mineralList.length; i < len; i++) {
    const mineral = mineralList[i];
    cluster.queue({
      url: `https://zh.mindat.org/search.php?search=${mineral}`,
      // url: `https://www.mindat.org/search.php?search=${mineral}`,
      index: i,
      total: len,
      name: mineral,
    });
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

  const rows = await fetchMineralListInfo(mineralList);

  json2csv([cols, ...rows]);
};;

main();
