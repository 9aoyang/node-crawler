const fs = require('fs');
const { Cluster } = require('puppeteer-cluster');

const crawler = require('./crawler');
const json2csv = require('./json2csv');
const cols = require('./cols');

const fetchMineralListInfo = async (mineralList) => {
  const rows = [];
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    puppeteerOptions: {
      headless: true,
      args: [
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

    const details = await page.evaluate(crawler);
    rows.push([name, details]);
    console.log(`任务 ${index} 完成, 共 ${total} 个任务`);
  });

  for (let i = 0, len = mineralList.length; i < 3; i++) {
    const mineral = mineralList[i];
    cluster.queue({
      url: `https://zh.mindat.org/search.php?search=${mineral}`,
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
