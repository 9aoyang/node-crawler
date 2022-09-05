const fs = require('fs');

const xlsx = require('node-xlsx');

const output = 'list.csv';

const json2csv = (data) => {
  const buffer = xlsx.build([
    {
      name: 'list',
      data,
    },
  ]);
  fs.writeFileSync(output, buffer, 'binary');
};

module.exports = json2csv;
