const linkCrawler = () => {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });

  let links = [];
  const elements = document.querySelectorAll('.lli ~ a');

  for (let i = 0, len = elements.length; i < len; i++) {
    links[i] = elements[i].href;
  }

  return links;
};

const locCrawler = () => {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });

  const cols = [
    'Regional',
    'Latitude & Longitude (WGS84):',
    'Latitude & Longitude (decimal):',
    'GeoHash:',
    'GRN:',
    'Locality type:',
    'Köppen climate type:',
  ];

  let infos = new Array(8).fill('');

  const h1 = document.querySelector('h1');
  infos[0] = h1.textContent.split('Regional')[0];

  const rows = document.querySelectorAll('#locinfodiv .LFtr');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const th = row.querySelector('.LFth');
    const td = row.querySelector('.LFtd');

    if (th && th.textContent && td && td.textContent) {
      const key = th.textContent.trim();
      const value = td.textContent.trim();

      const index = cols.findIndex((item) => key === item);
      if (index != -1) {
        if (value) {
          infos[index] = value;
        }
      }
    }
  }

  console.log(infos);

  return infos;
};

module.exports = { linkCrawler, locCrawler };
