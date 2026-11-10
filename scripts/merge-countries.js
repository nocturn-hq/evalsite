// Put your Gemini JSON parts in data/parts/*.json, then: npm run countries
const fs=require('fs'),dir='data/parts',map={};
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')))for(const c of JSON.parse(fs.readFileSync(dir+'/'+f,'utf8')))map[c.iso2]=c;
const list=Object.values(map).sort((a,b)=>a.country.localeCompare(b.country));
fs.writeFileSync('public/countries.json',JSON.stringify(list));console.log(list.length+' countries written to public/countries.json');
