// Edit data/countries.txt (Country|ISO2|CODE|SYMBOL|RATE_PER_USD), then run: npm run countries
const fs=require('fs');
const list=fs.readFileSync('data/countries.txt','utf8').split('\n').filter(Boolean).map(l=>{const[country,iso2,currency_code,symbol,r]=l.split('|');return{country,iso2,currency_code,symbol,rate_per_usd:+r}})
  .sort((a,b)=>a.country.localeCompare(b.country));
fs.writeFileSync('public/countries.json',JSON.stringify(list));console.log(list.length+' countries written to public/countries.json');
