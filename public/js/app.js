const $=s=>document.querySelector(s);let C=[];
const api=async(p,b)=>{const r=await fetch('/api'+p,{method:b?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(localStorage.t||'')},body:b?JSON.stringify(b):undefined});
  const j=await r.json();if(!r.ok){if(r.status===401&&!['home','login','signup'].includes(document.body.dataset.p))location='/login.html';throw new Error(j.error||'Something went wrong')}return j};
const dev=()=>localStorage.d||(localStorage.d=crypto.randomUUID()); // TODO: swap for FingerprintJS
// Dollars first, local-currency estimate below. Amounts are stored in KES.
const money=(kes,cc)=>{const usd=kes/C.find(x=>x.iso2==='KE').rate_per_usd,c=C.find(x=>x.iso2===cc);
  return `<span class="money"><b>$${usd.toFixed(2)}</b>`+(c&&c.currency_code!=='USD'?`<small>≈ ${c.symbol} ${(usd*c.rate_per_usd).toLocaleString(undefined,{maximumFractionDigits:2})} ${c.currency_code}</small>`:'')+'</span>'};
const logout=()=>{localStorage.removeItem('t');location='/'};
const submit=(id,fn)=>$(id).onsubmit=async e=>{e.preventDefault();const f=e.target,er=f.querySelector('.err');if(er)er.textContent='';try{await fn(Object.fromEntries(new FormData(f)))}catch(x){if(er)er.textContent=x.message}};

const pages={
 home(){},
 signup(){
  $('#country').innerHTML='<option value="">Select your country</option>'+C.map(c=>`<option value="${c.iso2}">${c.country}</option>`).join('');
  $('[name=ref]').value=new URLSearchParams(location.search).get('ref')||'';
  submit('#f',async d=>{localStorage.t=(await api('/signup',{...d,deviceId:dev()})).token;location='/dashboard.html'});
 },
 login(){submit('#f',async d=>{localStorage.t=(await api('/login',d)).token;location='/dashboard.html'})},
 async dashboard(){
  const{user,payoutDate,referrals}=await api('/me');
  $('#bal').innerHTML=money(user.balanceKes,user.country);
  $('#pay').textContent=payoutDate?new Date(payoutDate).toDateString():'Not announced yet';
  $('#ref').value=location.origin+'/signup.html?ref='+user.refCode;$('#refs').textContent=referrals;
  $('#bonus').innerHTML=money(40,user.country);
  const tasks=await api('/tasks');
  $('#tasks').innerHTML=tasks.length?tasks.map(t=>`<div class="card"><span class="tag">${t.type}</span><h3>${t.title}</h3>
   <p><a href="${t.url}" target="_blank" rel="noopener">Open ${t.type}</a></p>${money(t.rewardKes,user.country)}
   <textarea id="a${t._id}" placeholder="Your evaluation"></textarea><button onclick="evalTask('${t._id}')">Submit evaluation</button></div>`).join('')
   :'<div class="empty">Nothing to evaluate right now. You have evaluated everything available. Check back soon.</div>';
 },
 async admin(){
  const u=await api('/admin/users');$('#users').innerHTML=u.map(x=>`<tr><td>${x.email}</td><td>${x.country}</td><td>${x.balanceKes} KES</td></tr>`).join('');
  submit('#tf',async d=>{d.rewardKes=+d.rewardKes;await api('/admin/tasks',d);$('#tf').reset();$('#tmsg').textContent='Task published'});
  submit('#pf',async d=>{await api('/admin/payout-date',d);$('#pmsg').textContent='Payout date saved'});
 }};
window.evalTask=async id=>{try{await api(`/tasks/${id}/evaluate`,{answer:$('#a'+id).value});location.reload()}catch(x){alert(x.message)}};
fetch('/countries.json').then(r=>r.json()).then(d=>{C=d;pages[document.body.dataset.p]?.()}).catch(()=>{});
