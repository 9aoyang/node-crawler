const fs = require('fs');
const xlsx = require('node-xlsx');
const cols = require('./cols');
const json2csv = require('./json2csv');

const isCSV = (file) => {
  return file.endsWith('.csv');
};

const csvPath = './csv';

fs.readdir(csvPath, 'utf-8', (err, files) => {
  if (err) throw new Error(err);

  const res = files.reduce(
    (acc, cur) =>
      isCSV(cur)
        ? [...acc, ...xlsx.parse(csvPath + '/' + cur)[0].data.slice(1)]
        : acc,
    [cols]
  );

  json2csv(res);
});
