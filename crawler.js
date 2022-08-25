const crawler = () => {
  const keywords = [
    'Class (H-M):',
    'Morphology:',
    'Twinning:',
    'Type:',
    '2V:',
    'Birefringence:',
    'Max Birefringence:',
    'Surface Relief:',
    'Optical Extinction:',
    'Pleochroism:',
    'Ratio:',
    'Unit Cell V:',
    'Common Impurities:',
  ];

  let row = new Array(keywords.length).fill('');
  const infos = document.querySelectorAll('.mindatarow');

  for (let i = 0; i < infos.length; i++) {
    const info = infos[i];
    const key = info.querySelector('.mindatath');
    const value = info.querySelector('.mindatam2');

    if (key && value) {
      const index = keywords.findIndex((item) => item === key.textContent);
      if (index !== -1) {
        row[index] = value.textContent;
      }
    }
  }

  return row;
};

module.exports = crawler;
