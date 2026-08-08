'use strict';
const assert=require('assert');const fs=require('fs');const {filterCommands,parseOption,CATEGORIES}=require('./app.js');
const commands=JSON.parse(fs.readFileSync(`${__dirname}/commands.json`,'utf8'));
assert(commands.length>=150&&commands.length<=200);assert.strictEqual(new Set(commands.map(c=>c.category)).size,18);assert.deepStrictEqual([...new Set(commands.map(c=>c.category))],CATEGORIES);
commands.forEach(c=>{['name','category','description','options','examples','related'].forEach(key=>assert(c[key]));assert(Array.isArray(c.options)&&c.options.length);assert(Array.isArray(c.examples)&&c.examples.length)});
assert(filterCommands(commands,'文字列').some(c=>c.name==='grep'));assert(filterCommands(commands,'docker').every(c=>c.category==='Docker'||`${c.name} ${c.description}`.toLowerCase().includes('docker')));assert(filterCommands(commands,'','SSH').every(c=>c.category==='SSH'));assert.deepStrictEqual(parseOption('-i: test'),['-i','test']);
console.log(`Linux Command Explorer tests passed (${commands.length} commands)`);
