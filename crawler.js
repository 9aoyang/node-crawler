const mineralLinkCrawler = () => {
  let links = [];
  const elements = document.querySelectorAll('a');

  for (let i = 0, len = elements.length; i < len; i++) {
    links[i] = [elements[i].textContent, elements[i].href];
  }

  return links;
};
const cardLinkCrawler = () => {
  let links = [];
  const elements = document.querySelectorAll('a');

  for (let i = 0, len = elements.length; i < len; i++) {
    links[i] = elements[i].href;
  }

  return links;
};

const infoLinkCrawler = () => {
  const links = [];
  const isMatched = (text) =>
    ['Atomic Positions', 'Full Information Card', 'Lattice Energy'].includes(
      text
    );
  const elements = document
    .querySelector('frame[name="menu"]')
    .contentWindow.document.querySelectorAll('a');

  for (let i = 0, len = elements.length; i < len; i++) {
    if (isMatched(elements[i].innerText)) {
      links.push(elements[i].href);
    }
  }
  return links;
};

const infoDetailCrawler = () => {
  const html = document.body.innerHTML;
  return html;
};

module.exports = {
  mineralLinkCrawler,
  cardLinkCrawler,
  infoLinkCrawler,
  infoDetailCrawler,
};
