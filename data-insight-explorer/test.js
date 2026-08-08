const assert=require('node:assert/strict');const {splitCSV,detectDelimiter,parseData,stats}=require('./app');
assert.deepEqual(splitCSV('\uFEFFname,value\n"A, B",10'),[['name','value'],['A, B','10']]);
assert.equal(detectDelimiter('a;b;c\n1;2;3'),';');
const parsed=parseData('name,value\nA,10\nB,20','csv-header','auto');assert.deepEqual(parsed.headers,['name','value']);assert.deepEqual(parsed.numeric,[1]);
const s=stats([1,2,3,4,100]);assert.equal(s.count,5);assert.equal(s.sum,110);assert.deepEqual(s.outliers,[100]);
console.log('data-insight-explorer tests passed');
