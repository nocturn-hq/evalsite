// MawiE admin panel. One page, hash routes (#/users), no build step.
// Relies on app.js for: $, esc, api, svg, ICON, C (countries), logout.
window.adminInit=async()=>{
const $=(s,r=document)=>r.querySelector(s);
const gateP=api('/admin/gate').then(x=>x.state,()=>null); // runs at the same time as /me
let meErr=null;const meRes=await api('/me').catch(e=>{meErr=e;return null});
if(!meRes){document.body.innerHTML='<p style="padding:40px;font:16px system-ui;max-width:560px"><b>Could not reach the server.</b><br>'+esc(meErr&&meErr.message||'')+'<br><br><a href="/mawira.html">Try again</a> &middot; <a href="/dashboard.html">Go to your dashboard</a></p>';return}
if(!meRes.user?.isAdmin){document.body.innerHTML='<p style="padding:40px;font:16px system-ui;max-width:560px"><b>This account is not an admin.</b><br>Log in with the Gmail set as ADMIN_EMAIL in your .env file.<br><br><a href="/dashboard.html">Go to your dashboard</a> &middot; <a href="#" onclick="logout();return false">Log out</a></p>';return}

// ---------- secret admin password: nothing in the panel loads until it is entered ----------
const gateState=async()=>(await api('/admin/gate')).state;
const askGate=state=>new Promise(done=>{
  const setup=state==='setup',el=document.createElement('div');el.className='gate';
  el.innerHTML=`<form class="gcard" novalidate><img src="/img/logo.png" alt=""><h2>${setup?'Create your admin password':'Admin password'}</h2>
   <p>${setup?'Choose a secret password for this panel. Only you should know it. Use something different from your login password.':'Enter your secret admin password to open the panel.'}</p>
   <div class="f"><label for="gp">${setup?'New admin password':'Password'}</label><input id="gp" name="password" type="password" autocomplete="${setup?'new-password':'current-password'}" required></div>
   ${setup?'<div class="f"><label for="gc">Type it again</label><input id="gc" name="confirm" type="password" autocomplete="new-password" required><p class="hint">At least 8 characters with a lowercase letter, an uppercase letter, a number and a symbol.</p></div>':''}
   <p class="err" role="alert"></p><button class="b pri" type="submit">${setup?'Save and open panel':'Open panel'}</button>
   <a class="gback" href="/dashboard.html">Back to my dashboard</a></form>`;
  document.body.appendChild(el);const f=el.querySelector('form');el.querySelector('input').focus();
  f.onsubmit=async e=>{e.preventDefault();const er=f.querySelector('.err');er.textContent='';
    try{const r=await api('/admin/gate/'+(setup?'setup':'unlock'),Object.fromEntries(new FormData(f)));sessionStorage.gateT=r.token;el.remove();done()}catch(x){er.textContent=x.message}}});
{const st=await gateP;if(st===null)throw new Error('Could not check the admin password. Try again.');if(st!=='open')await askGate(st)}

Object.assign(ICON,{
 grid:svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
 cog:svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
 sun:svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
 moon:svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
 search:svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
 menu:svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
 x:svg('<path d="M6 6l12 12M18 6L6 18"/>'),
 download:svg('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
 refresh:svg('<path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4"/>'),
 edit:svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
 trash:svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'),
 up:svg('<path d="M6 15l6-6 6 6"/>'),down:svg('<path d="M6 9l6 6 6-6"/>'),
 logout:svg('<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>'),
 home:svg('<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>'),
 minus:svg('<path d="M5 12h14"/>')});
hydrate();
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const KE=()=>C.find(x=>x.iso2==='KE');
const usd=k=>k/KE().rate_per_usd;
const usdS=k=>'$'+usd(k).toFixed(2);
const $m=k=>`<span class="money"><b>${usdS(k)}</b><small>${Math.round(k).toLocaleString()} KES</small></span>`;
const cname=i=>C.find(c=>c.iso2===i)?.country||i||'';
const flag=i=>/^[A-Za-z]{2}$/.test(i||'')?String.fromCodePoint(...[...i.toUpperCase()].map(c=>127397+c.charCodeAt())):'';
const date=d=>d?new Date(d).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'Never';
const ago=d=>{if(!d)return 'Never';const s=(Date.now()-new Date(d))/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';if(s<86400*30)return Math.floor(s/86400)+' d ago';return date(d)};
const ini=u=>esc((u.username||u.email||'?')[0]);
const nm=u=>u?esc(u.username||u.email):'(deleted)';
const badge=u=>u.banned?'<span class="badge no">Banned</span>':u.isAdmin?'<span class="badge sun">Admin</span>':'<span class="badge ok">Active</span>';
const TYPE={video:'Video',survey:'Survey',app:'App test'};
const KIND={video:'Video',survey:'Survey',app:'App test',referral:'Referral',bonus:'Bonus',adjust:'Adjustment',revoke:'Revoked'};
const empty=(t,s='')=>`<div class="empty"><b>${t}</b>${s}</div>`;
const skel='<div class="card"><div class="skel" style="width:40%"></div><div class="skel"></div><div class="skel"></div><div class="skel" style="width:70%"></div></div>';
const pagehead=(t,s,right='')=>`<div class="pagehead"><div><h2>${t}</h2>${s?`<p>${s}</p>`:''}</div><div class="row">${right}</div></div>`;
const debounce=(f,ms=300)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
const seg=(opts,cur,id)=>`<div class="seg" id="${id}" role="group">${opts.map(([v,l])=>`<button type="button" data-v="${v}" class="${String(cur)===String(v)?'on':''}">${l}</button>`).join('')}</div>`;
const bindSeg=(id,fn)=>{const e=$('#'+id);e.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;$$('button',e).forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v)}};
const pager=(el,d,label,fn)=>{el.innerHTML=`<span>${d.total.toLocaleString()} ${label}</span><span class="row"><button type="button" class="b sm" data-p="-1" ${d.page<=1?'disabled':''}>Previous</button><span>Page ${d.page} of ${d.pages}</span><button type="button" class="b sm" data-p="1" ${d.page>=d.pages?'disabled':''}>Next</button></span>`;
  el.onclick=e=>{const b=e.target.closest('[data-p]');if(b&&!b.disabled)fn(d.page+ +b.dataset.p)}};
const toast=(m,bad)=>{const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=m;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),3800)};
const act=async(fn,ok)=>{try{const r=await fn();if(ok)toast(ok);return r??true}catch(e){toast(e.message,true);return false}};
const copy=async t=>{try{await navigator.clipboard.writeText(t);toast('Copied')}catch{toast('Copy failed',true)}};
const download=async(path,name)=>{const r=await fetch('/api'+path,{headers:{Authorization:'Bearer '+localStorage.t,'x-gate':sessionStorage.gateT||''}});if(!r.ok)throw new Error('Export failed');
  const a=document.createElement('a');a.href=URL.createObjectURL(await r.blob());a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
const ytId=u=>{u=String(u||'').trim();let m=u.match(/^[\w-]{11}$/);if(m)return m[0];m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/))([\w-]{11})/i);return m?m[1]:null};

// ---------- overlay pieces: drawer, dialog, palette ----------
const ov=$('#ov'),drawer=$('#drawer'),dlg=$('#dlg'),pal=$('#pal');
const syncOv=()=>ov.classList.toggle('on',drawer.classList.contains('on')||dlg.classList.contains('on'));
const closeDrawer=()=>{drawer.classList.remove('on');syncOv()};
let dlgDone=null;
const closeDlg=v=>{dlg.classList.remove('on');syncOv();const f=dlgDone;dlgDone=null;f&&f(v)};
// resolves with an object of the dialog's named fields, or null if cancelled
const dialog=({title,text='',html='',ok='Save',danger,validate})=>new Promise(res=>{
  dlgDone=res;
  dlg.innerHTML=`<h3>${title}</h3>${text?`<p>${text}</p>`:''}<form novalidate>${html}<p class="err" role="alert"></p><div class="acts"><button type="button" class="b" data-no>Cancel</button><button type="submit" class="b ${danger?'bad':'pri'}">${ok}</button></div></form>`;
  const f=$('form',dlg);
  f.onsubmit=e=>{e.preventDefault();const v={};$$('[name]',f).forEach(i=>v[i.name]=i.type==='checkbox'?i.checked:i.value);const bad=validate&&validate(v);if(bad){$('.err',dlg).textContent=bad;return}closeDlg(v)};
  $('[data-no]',dlg).onclick=()=>closeDlg(null);
  dlg.classList.add('on');ov.classList.add('on');($('input:not([type=checkbox]),textarea',dlg)||$('button[type=submit]',dlg)).focus();
});
ov.onclick=()=>{if(dlg.classList.contains('on'))closeDlg(null);else closeDrawer()};
$('#scrim').onclick=()=>toggleSide(false);
const toggleSide=on=>{$('#side').classList.toggle('open',on);$('#scrim').classList.toggle('on',on)};
$('#menu').onclick=()=>toggleSide(true);

// ---------- theme ----------
const paintTheme=()=>{const d=document.documentElement.dataset.theme==='dark';$('#theme').innerHTML=(d?ICON.sun:ICON.moon)+(d?'Light mode':'Dark mode')};
const toggleTheme=()=>{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;try{localStorage.adminTheme=n}catch{}paintTheme();if(R.chartRedraw)R.chartRedraw()};
$('#theme').onclick=toggleTheme;paintTheme();
$('#lockb').onclick=()=>{sessionStorage.removeItem('gateT');location.reload()};
$('#meav').textContent=(meRes.user.username||meRes.user.email)[0];$('#mename').textContent=meRes.user.username||'';

// ---------- routes ----------
const ROUTES=[
 {id:'overview',t:'Overview',i:'grid',g:'Insights'},
 {id:'users',t:'Users',i:'users',g:'People'},
 {id:'chats',t:'Support chat',i:'message',g:'People'},
 {id:'submissions',t:'Submissions',i:'inbox',g:'People'},
 {id:'referrals',t:'Referrals',i:'gift',g:'People'},
 {id:'leaderboard',t:'Leaderboard',i:'trophy',g:'People'},
 {id:'tasks',t:'Manage tasks',i:'layers',g:'Content'},
 {id:'videos',t:'Add videos',i:'video',g:'Content'},
 {id:'create',t:'Add survey or app',i:'survey',g:'Content'},
 {id:'ledger',t:'Money ledger',i:'wallet',g:'Money'},
 {id:'settings',t:'Settings',i:'cog',g:'Site'},
 {id:'audit',t:'Audit log',i:'shield',g:'Site'}];
$('#nav').innerHTML=ROUTES.map((r,i)=>(i===0||ROUTES[i-1].g!==r.g?`<div class="grp">${r.g}</div>`:'')+`<a class="nv" href="#/${r.id}" data-r="${r.id}">${ICON[r.i]}${r.t}</a>`).join('');
const go=id=>{location.hash='#/'+id};
const R={cur:'',tok:0};
const S={ // remembered filters, so going back to a page feels the same
 users:{q:'',status:'',country:'',sort:'new',page:1},submissions:{type:'',q:'',page:1},tasks:{type:'',q:'',status:''},
 ledger:{kind:'',q:'',page:1},audit:{page:1},overview:{range:14,metric:'logins'}};
const V={};
// warm the next page while the pointer is over its menu item (or a finger touches it), so the click opens it at once
{const PRE={overview:()=>'/admin/overview?range='+S.overview.range,
  users:()=>'/admin/users?'+new URLSearchParams({q:S.users.q,status:S.users.status,country:S.users.country,sort:S.users.sort,page:S.users.page,limit:25}),
  submissions:()=>'/admin/submissions?'+new URLSearchParams(S.submissions),referrals:()=>'/admin/referrals',leaderboard:()=>'/admin/leaderboard',
  tasks:()=>'/admin/tasks?'+new URLSearchParams({type:S.tasks.type,q:S.tasks.q}),ledger:()=>'/admin/transactions?'+new URLSearchParams(S.ledger),
  audit:()=>'/admin/audit?page='+S.audit.page,settings:()=>'/admin/settings'};
 const warm=e=>{const a=e.target.closest&&e.target.closest('a[data-r]'),f=a&&PRE[a.dataset.r];if(f&&a.dataset.r!==R.cur)api(f(),undefined,1).catch(()=>{})};
 ['pointerover','focusin','touchstart'].forEach(ev=>$('#nav').addEventListener(ev,warm,{passive:true}))}
const route=async()=>{
  const id=(location.hash.match(/^#\/(\w+)/)||[])[1],r=ROUTES.find(x=>x.id===id)||ROUTES[0];
  R.cur=r.id;R.chartRedraw=null;const my=++R.tok,live=()=>my===R.tok;
  $$('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.r===r.id));$('#title').textContent=r.t;document.title=r.t+' | MawiE Admin';toggleSide(false);
  $('#view').innerHTML=skel;
  try{await V[r.id](live)}catch(e){if(live())$('#view').innerHTML=`<div class="card">${empty('Could not load this page',esc(e.message))}</div>`}
  window.scrollTo(0,0);
};
window.addEventListener('hashchange',route);
// unread support messages show as a number on the menu item
const chatBadge=n=>{const a=$('#nav a[data-r=chats]');if(!a)return;let b=a.querySelector('.mc-nb');if(!n){if(b)b.remove();return}
  if(!b){b=document.createElement('span');b.className='mc-nb';a.appendChild(b)}b.textContent=n>99?'99+':n};
{const chk=()=>{if(!document.hidden)api('/admin/chats/unread?fresh=1',undefined,1).then(d=>chatBadge(d.n)).catch(()=>{})};chk();setInterval(chk,15000)}

// ---------- overview ----------
const niceStep=(x,int)=>{if(x<=0)return 1;const p=10**Math.floor(Math.log10(x)),f=x/p,n=f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10;return int?Math.max(1,Math.ceil(n*p)):n*p};
function drawChart(el,tip,days,vals,fmt,int){
  const W=720,H=270,L=44,Rr=14,T=16,B=30,max=Math.max(...vals,int?1:0.01),step=niceStep(max/4,int),top=step*4,
    X=i=>L+i*(W-L-Rr)/(days.length-1),Y=v=>T+(H-T-B)*(1-v/top);
  let g='';for(let i=0;i<=4;i++){const v=step*i,y=Y(v);g+=`<line class="grid" x1="${L}" x2="${W-Rr}" y1="${y}" y2="${y}"/><text x="${L-8}" y="${y+4}" text-anchor="end">${fmt(v,1)}</text>`}
  const every=Math.ceil(days.length/7);days.forEach((d,i)=>{if(i===days.length-1||(i%every===0&&days.length-1-i>every/2))g+=`<text x="${X(i)}" y="${H-8}" text-anchor="${i===0?'start':i===days.length-1?'end':'middle'}">${new Date(d+'T00:00:00Z').toLocaleDateString(undefined,{day:'numeric',month:'short',timeZone:'UTC'})}</text>`});
  const pts=vals.map((v,i)=>X(i)+','+Y(v)),area=`M${X(0)},${Y(0)} L${pts.join(' L')} L${X(days.length-1)},${Y(0)}Z`;
  g+=`<path class="ar" d="${area}" fill="var(--ac)"/><polyline class="ln" stroke="var(--ac)" points="${pts.join(' ')}"/><g id="hv" style="display:none"><line class="cx" y1="${T}" y2="${H-B}" id="hl"/><circle r="5" fill="var(--ac)" stroke="var(--surf)" stroke-width="2" id="hd"/></g><rect x="${L}" y="${T}" width="${W-L-Rr}" height="${H-T-B}" fill="transparent" id="hr"/>`;
  el.innerHTML=g;
  const hv=$('#hv',el),hr=$('#hr',el);
  const move=e=>{const b=el.getBoundingClientRect(),x=(e.clientX-b.left)/b.width*W,i=Math.max(0,Math.min(days.length-1,Math.round((x-L)/((W-L-Rr)/(days.length-1)))));
    hv.style.display='';$('#hl',el).setAttribute('x1',X(i));$('#hl',el).setAttribute('x2',X(i));$('#hd',el).setAttribute('cx',X(i));$('#hd',el).setAttribute('cy',Y(vals[i]));
    tip.style.display='block';tip.style.left=(X(i)/W*b.width)+'px';tip.style.top=(Y(vals[i])/H*b.height)+'px';
    tip.innerHTML=`${fmt(vals[i])}<small>${new Date(days[i]+'T00:00:00Z').toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'})}</small>`};
  hr.onpointermove=move;hr.onpointerdown=move;hr.onpointerleave=()=>{hv.style.display='none';tip.style.display='none'};
}
V.overview=async live=>{
  const st=S.overview,o=await api('/admin/overview?range='+st.range);if(!live())return;
  if(!Array.isArray(o.earned)||!Array.isArray(o.recentTx))throw new Error('The server is running an older version of the code. Stop it, then start it again with npm start.');
  const pct=([a,b])=>b?Math.round((a-b)/b*100):(a?null:0);
  const dl=p=>{const v=pct(p),c=v===0?'fl':(v===null||v>0)?'':'dn';return `<span class="dl ${c}">${v===null?'new':(v>0?'+':'')+v+'%'}</span>`};
  const kpi=(cls,ic,l,v,sub)=>`<div class="kpi ${cls}"><div class="kh"><span class="ki">${ICON[ic]}</span>${l}</div><b>${v}</b><div class="sub">${sub}</div></div>`;
  const M={logins:['Logins',o.logins,v=>Math.round(v).toLocaleString(),1],signups:['Signups',o.signups,v=>Math.round(v).toLocaleString(),1],evaluations:['Tasks completed',o.evaluations,v=>Math.round(v).toLocaleString(),1],earned:['Paid to users',o.earned.map(usd),(v,ax)=>'$'+(ax&&v>=10?Math.round(v):v.toFixed(2)),0]};
  const mx=Math.max(1,...o.countries.map(c=>c.n)),tmx=Math.max(1,...o.types.map(t=>t.n)),tl=o.types.reduce((n,t)=>n+t.n,0);
  $('#view').innerHTML=pagehead('Overview','How the site is doing, at a glance.',`${seg([[7,'7 days'],[14,'14 days'],[30,'30 days'],[90,'90 days']],st.range,'rng')}<button type="button" class="b ic" id="rfr" aria-label="Refresh">${ICON.refresh}</button>`)+`
  <div class="kpis">
   ${kpi('','users','Users',o.total.toLocaleString(),`${dl(o.delta.signups)} ${o.delta.signups[0]} new this week`)}
   ${kpi('','activity','Active today',o.activeToday.toLocaleString(),`${o.active7} active in the last 7 days`)}
   ${kpi('sun','wallet','Paid this week',usdS(o.delta.paid[0]),`${dl(o.delta.paid)} vs the week before`)}
   ${kpi('','checkc','Tasks completed',o.evals.toLocaleString(),`${dl(o.delta.evals)} ${o.delta.evals[0]} this week`)}
   ${kpi('sun','coins','Owed to users',usdS(o.balanceKes),`${Math.round(o.balanceKes).toLocaleString()} KES in balances`)}
   ${kpi('','layers','Live tasks',`${o.liveTasks}<span class="mu" style="font-size:1rem"> / ${o.tasks}</span>`,`${o.tasks-o.liveTasks} hidden`)}
   ${kpi('','gift','Referred accounts',o.referred.toLocaleString(),`${o.total?Math.round(o.referred/o.total*100):0}% of all users`)}
   ${kpi('bad','ban','Banned',o.banned.toLocaleString(),o.banned?'<a href="#/users" id="bn">Review banned users</a>':'None right now')}
  </div>
  <div class="card" style="margin-bottom:18px"><div class="row sp" style="margin-bottom:6px"><h3>Trend</h3>${seg(Object.entries(M).map(([k,v])=>[k,v[0]]),st.metric,'met')}</div>
   <p class="mu" id="tsum" style="margin-bottom:8px"></p><div class="chartbox"><svg id="chart" class="chart" viewBox="0 0 720 270" role="img" aria-label="Trend chart"></svg><div class="tip" id="tip"></div></div></div>
  <div class="g21" style="margin-bottom:18px">
   <div class="card"><h3>Recent money activity</h3><ul class="list">${o.recentTx.map(t=>`<li><span class="av">${esc((t.user||'?')[0])}</span><div class="grow"><b>${esc(t.user)}</b><small>${esc(t.note||KIND[t.kind]||t.kind)} · ${ago(t.createdAt)}</small></div><span class="${t.amountKes<0?'neg':'pos'}">${t.amountKes<0?'-':'+'}${usdS(Math.abs(t.amountKes))}</span></li>`).join('')||empty('No money has moved yet')}</ul></div>
   <div class="card"><h3>Where users are from</h3><div class="bars">${o.countries.map(c=>`<div class="bar"><div class="bt"><span>${flag(c.country)} ${esc(cname(c.country))}</span><span>${c.n}</span></div><div class="tr"><i style="width:${c.n/mx*100}%"></i></div></div>`).join('')||empty('No users yet')}</div></div>
  </div>
  <div class="g3">
   <div class="card"><h3>Task mix</h3><div class="bars">${o.types.map((t,i)=>`<div class="bar ${i%2?'s2':''}"><div class="bt"><span>${TYPE[t.type]||t.type}s</span><span>${t.n} of ${tl}</span></div><div class="tr"><i style="width:${t.n/tmx*100}%"></i></div></div>`).join('')||empty('No tasks yet')}</div>
    <h3 style="margin:18px 0 6px">Most completed</h3><ul class="list">${o.topTasks.map(t=>`<li><div class="grow"><b>${esc(t.title)}</b><small>${TYPE[t.type]||''}</small></div><span class="badge">${t.n} done</span></li>`).join('')||'<li class="mu">Nothing completed yet</li>'}</ul></div>
   <div class="card"><h3>Newest members</h3><ul class="list">${o.recent.map(u=>`<li class="click" data-u="${u._id}" style="cursor:pointer"><span class="av">${ini(u)}</span><div class="grow"><b>${nm(u)}</b><small>${flag(u.country)} ${esc(cname(u.country))} · ${ago(u.createdAt)}</small></div></li>`).join('')||'<li class="mu">No members yet</li>'}</ul></div>
   <div class="card"><h3>Admin activity</h3><ul class="list">${o.recentAudit.map(a=>`<li><div class="grow"><b>${esc(a.adminName)} · ${esc(a.action.replace(/[.-]/g,' '))}</b><small>${esc(a.target||'')} · ${ago(a.createdAt)}</small></div></li>`).join('')||'<li class="mu">No admin actions yet</li>'}</ul></div>
  </div>`;
  const paint=()=>{const[l,v,f,int]=M[st.metric],tot=v.reduce((a,b)=>a+b,0);
    $('#tsum').innerHTML=`<b>${st.metric==='earned'?'$'+tot.toFixed(2):tot.toLocaleString()}</b> ${l.toLowerCase()} in ${st.range} days · average ${st.metric==='earned'?'$'+(tot/st.range).toFixed(2):(tot/st.range).toFixed(1)} a day`;
    drawChart($('#chart'),$('#tip'),o.days,v,f,int)};
  R.chartRedraw=paint;paint();
  bindSeg('met',v=>{st.metric=v;paint()});bindSeg('rng',v=>{st.range=+v;route()});$('#rfr').onclick=route;
  $('#view').onclick=e=>{const u=e.target.closest('[data-u]');if(u)openUser(u.dataset.u);const b=e.target.closest('#bn');if(b){S.users.status='banned';S.users.page=1}};
};

// ---------- users ----------
const selU=new Set();
V.users=async live=>{
  const st=S.users;selU.clear();
  $('#view').innerHTML=pagehead('Users','Search, filter and manage every account.',`<button type="button" class="b" id="exp">${ICON.download}Export CSV</button>`)+`
  <div class="card"><div class="row" style="margin-bottom:14px">
    <div class="grow" style="flex:2"><input id="uq" type="search" placeholder="Search username or email  ( / )" value="${esc(st.q)}" aria-label="Search users"></div>
    <select id="us" style="width:auto" aria-label="Status"><option value="">All statuses</option><option value="active">Active</option><option value="banned">Banned</option><option value="admin">Admins</option></select>
    <select id="uc" style="width:auto;max-width:190px" aria-label="Country"><option value="">All countries</option>${[...C].sort((a,b)=>a.country.localeCompare(b.country)).map(c=>`<option value="${c.iso2}">${esc(c.country)}</option>`).join('')}</select>
    <select id="so" style="width:auto" aria-label="Sort by"><option value="new">Newest first</option><option value="old">Oldest first</option><option value="balance">Highest balance</option><option value="login">Last login</option><option value="name">Name A to Z</option></select></div>
   <div class="bulk" id="bulk" hidden><span id="bn2"></span><button type="button" class="b sm" id="bban">Ban selected</button><button type="button" class="b sm" id="bunban">Unban selected</button><button type="button" class="b sm" id="bclr">Clear</button></div>
   <div class="tw" id="ut"></div><div class="pager" id="up"></div></div>`;
  $('#us').value=st.status;$('#uc').value=st.country;$('#so').value=st.sort;
  const qs=()=>new URLSearchParams({q:st.q,status:st.status,country:st.country,sort:st.sort,page:st.page,limit:25}).toString();
  const bulkUI=()=>{$('#bulk').hidden=!selU.size;$('#bn2').textContent=selU.size+' selected'};
  const load=async()=>{
    const d=await api('/admin/users?'+qs());if(!live())return;
    $('#ut').innerHTML=d.items.length?`<table><thead><tr><th><input type="checkbox" id="ua" aria-label="Select all on this page"></th><th>User</th><th>Country</th><th class="num">Balance</th><th class="num">Invited</th><th class="num">Login days</th><th>Last login</th><th>Status</th><th></th></tr></thead><tbody>${d.items.map(u=>`<tr class="click" data-u="${u._id}"><td><input type="checkbox" data-s="${u._id}" aria-label="Select ${esc(u.username||u.email)}" ${selU.has(u._id)?'checked':''} ${u.isAdmin?'disabled':''}></td>
     <td><div class="who"><span class="av">${ini(u)}</span><div><b>${nm(u)}</b><small>${esc(u.email)}</small></div></div></td><td>${flag(u.country)} ${esc(cname(u.country))}</td><td class="num">${$m(u.balanceKes||0)}</td><td class="num">${u.referrals}</td><td class="num">${u.loginDays}</td><td>${ago(u.lastLoginAt)}</td><td>${badge(u)}</td><td><button type="button" class="b sm">Open</button></td></tr>`).join('')}</tbody></table>`:empty('No users match','Try a different search or clear the filters.');
    pager($('#up'),d,'users',p=>{st.page=p;selU.clear();bulkUI();load()});bulkUI();
  };
  V.users.refresh=load;
  const onf=()=>{st.page=1;selU.clear();load()};
  $('#uq').oninput=debounce(e=>{st.q=e.target.value.trim();onf()});
  $('#us').onchange=e=>{st.status=e.target.value;onf()};$('#uc').onchange=e=>{st.country=e.target.value;onf()};$('#so').onchange=e=>{st.sort=e.target.value;onf()};
  $('#ut').onclick=e=>{
    if(e.target.id==='ua'){$$('[data-s]:not(:disabled)').forEach(c=>{c.checked=e.target.checked;e.target.checked?selU.add(c.dataset.s):selU.delete(c.dataset.s)});bulkUI();return}
    const c=e.target.closest('[data-s]');if(c){c.checked?selU.add(c.dataset.s):selU.delete(c.dataset.s);bulkUI();return}
    const r=e.target.closest('[data-u]');if(r)openUser(r.dataset.u)};
  $('#bclr').onclick=()=>{selU.clear();load()};
  const bulk=async banned=>{const ids=[...selU];let reason='';
    if(banned){const v=await dialog({title:`Ban ${ids.length} user${ids.length>1?'s':''}?`,text:'They will be signed out of everything and cannot log in.',ok:'Ban users',danger:1,html:'<div class="f"><label for="rs">Reason (they will see it)</label><input id="rs" name="reason" maxlength="200"></div>'});if(!v)return;reason=v.reason}
    else if(!await dialog({title:`Unban ${ids.length} user${ids.length>1?'s':''}?`,ok:'Unban'}))return;
    if(await act(()=>api('/admin/users/bulk-ban',{ids,banned,reason}),banned?'Users banned':'Users unbanned')){selU.clear();load()}};
  $('#bban').onclick=()=>bulk(true);$('#bunban').onclick=()=>bulk(false);
  $('#exp').onclick=()=>act(()=>download('/admin/users.csv?'+qs(),'mawie-users.csv'),'Export downloaded');
  await load();
};

// ---------- user drawer ----------
async function openUser(id){
  drawer.classList.add('on');ov.classList.add('on');drawer.innerHTML='<div class="db">'+skel+'</div>';
  let d;try{d=await api('/admin/users/'+id)}catch(e){drawer.innerHTML=`<div class="db"><div class="card">${empty('Could not load this user',esc(e.message))}</div></div>`;return}
  const u=d.user,self=u._id===meRes.user._id,name=u.username||u.email,refresh=()=>{openUser(id);if(R.cur==='users'&&V.users.refresh)V.users.refresh()};
  const row=(k,v)=>`<div class="row sp" style="padding:7px 0;border-bottom:1px solid var(--bd)"><span class="mu">${k}</span><span>${v}</span></div>`;
  drawer.innerHTML=`<div class="dh"><span class="av lg">${ini(u)}</span><div class="grow" style="min-width:0"><h2>${esc(name)}</h2><small>${esc(u.email)}</small><div class="chips" style="margin-top:6px">${badge(u)}${u.verified?'<span class="badge ok">Verified</span>':''}</div></div><button type="button" class="b ic" data-x aria-label="Close">${ICON.x}</button></div>
  <div class="db">
   <div class="tiles"><div class="tile"><small>Balance</small><b>${usdS(u.balanceKes||0)}</b></div><div class="tile"><small>Tasks done</small><b>${d.evaluations}</b></div><div class="tile"><small>Invited</small><b>${d.referred.length}</b></div><div class="tile"><small>Login days</small><b>${d.logins.length}</b></div></div>
   ${u.banned?`<div class="card" style="border-color:var(--bad)"><b class="neg">This account is banned</b><p class="mu">${esc(u.banReason||'No reason given')}</p></div>`:''}
   <div class="card"><h3>Details</h3>${row('Country',`${flag(u.country)} ${esc(cname(u.country))}`)}${row('Joined',date(u.createdAt))}${row('Last login',ago(u.lastLoginAt))}${row('Balance in KES',Math.round(u.balanceKes||0).toLocaleString())}${row('Referral code',`<b>${esc(u.refCode)}</b> <button type="button" class="b sm ic" data-copy="${esc(u.refCode)}" aria-label="Copy code">${ICON.copy}</button>`)}${row('Referred by',u.referredBy?esc(u.referredBy.username||u.referredBy.email):'Nobody')}</div>
   <div class="card"><h3>Adjust balance</h3><div class="row"><div class="grow"><label for="aa">Amount in KES</label><input id="aa" type="number" min="1" step="any" placeholder="e.g. 50"></div><div class="grow" style="flex:2"><label for="an">Reason</label><input id="an" maxlength="200" placeholder="Shown in the ledger"></div></div>
    <p class="hint" id="ah"></p><p class="err" id="ae" role="alert"></p><div class="row"><button type="button" class="b pri" id="aadd">${ICON.plus}Add money</button><button type="button" class="b" id="arem">${ICON.minus}Remove money</button></div></div>
   <div class="card"><h3>Admin note</h3><p class="hint" style="margin:-6px 0 8px">Only admins can see this.</p><textarea id="nt" maxlength="1000" placeholder="Anything worth remembering about this person">${esc(u.adminNote||'')}</textarea><div style="margin-top:10px"><button type="button" class="b" id="nsv">Save note</button></div></div>
   <div class="card"><h3>Account</h3><div class="row">
    ${self?'':`<button type="button" class="b ${u.banned?'':'soft'}" id="bn">${ICON.ban}${u.banned?'Unban account':'Ban account'}</button>`}
    <button type="button" class="b" id="rp">${ICON.key}Reset password</button>
    ${self?'':`<button type="button" class="b" id="rl">${ICON.shield}${u.isAdmin?'Remove admin':'Make admin'}</button>`}</div><div id="rpo" style="margin-top:12px"></div></div>
   <div class="card"><h3>Recent money activity</h3><ul class="list">${d.txns.map(t=>`<li><div class="grow"><b>${esc(t.note||KIND[t.kind]||t.kind)}</b><small>${KIND[t.kind]||t.kind} · ${ago(t.createdAt)}</small></div><span class="${t.amountKes<0?'neg':'pos'}">${t.amountKes<0?'-':'+'}${usdS(Math.abs(t.amountKes))}</span></li>`).join('')||'<li class="mu">No money activity yet</li>'}</ul></div>
   <div class="card"><h3>Invited accounts (${d.referred.length})</h3><ul class="list">${d.referred.map(r=>`<li style="cursor:pointer" data-u="${r._id}"><span class="av">${ini(r)}</span><div class="grow"><b>${nm(r)}</b><small>${date(r.createdAt)}</small></div>${badge(r)}</li>`).join('')||'<li class="mu">Nobody yet</li>'}</ul></div>
   <div class="card"><h3>Login days (last 30)</h3><div class="chips">${d.logins.map(l=>`<span class="badge ok">${esc(l.day.slice(5))}${l.count>1?' ×'+l.count:''}</span>`).join('')||'<span class="mu">No logins recorded</span>'}</div></div>
   ${self||u.isAdmin?'':`<div class="card" style="border-color:var(--bad)"><h3 class="neg">Delete account</h3><p class="mu" style="margin-bottom:12px">Removes the account, its history and its ledger. People they invited keep their accounts. This cannot be undone.</p><button type="button" class="b bad" id="del">${ICON.trash}Delete this account</button></div>`}
  </div>`;
  const q=s=>$(s,drawer);
  q('[data-x]').onclick=closeDrawer;
  drawer.onclick=e=>{const c=e.target.closest('[data-copy]');if(c)copy(c.dataset.copy);const r=e.target.closest('li[data-u]');if(r)openUser(r.dataset.u)};
  q('#aa').oninput=e=>q('#ah').textContent=+e.target.value>0?`About ${usdS(+e.target.value)}`:'';
  const adjust=async sign=>{const amt=+q('#aa').value,note=q('#an').value.trim();q('#ae').textContent='';
    if(!(amt>0))return q('#ae').textContent='Enter an amount greater than zero';if(!note)return q('#ae').textContent='Add a short reason';
    if(await act(()=>api(`/admin/users/${id}/adjust`,{amountKes:sign*amt,note}),sign>0?'Money added':'Money removed'))refresh()};
  q('#aadd').onclick=()=>adjust(1);q('#arem').onclick=()=>adjust(-1);
  q('#nsv').onclick=()=>act(()=>api(`/admin/users/${id}/note`,{note:q('#nt').value}),'Note saved');
  if(q('#bn'))q('#bn').onclick=async()=>{let reason='';
    if(!u.banned){const v=await dialog({title:`Ban ${esc(name)}?`,text:'They are signed out and cannot log in until you unban them.',ok:'Ban account',danger:1,html:'<div class="f"><label for="rs">Reason (they will see it)</label><input id="rs" name="reason" maxlength="200"></div>'});if(!v)return;reason=v.reason}
    else if(!await dialog({title:`Unban ${esc(name)}?`,ok:'Unban'}))return;
    if(await act(()=>api(`/admin/users/${id}/ban`,{banned:!u.banned,reason}),u.banned?'Account unbanned':'Account banned'))refresh()};
  q('#rp').onclick=async()=>{if(!await dialog({title:'Reset password?',text:`This makes a one-time password for ${esc(name)}. Their old password stops working straight away.`,ok:'Make new password',danger:1}))return;
    const r=await act(()=>api(`/admin/users/${id}/reset-password`,{}));if(r&&r.password){q('#rpo').innerHTML=`<p class="hint" style="margin-bottom:6px">Send this to them now. It is shown once.</p><div class="pwbox"><code>${esc(r.password)}</code><button type="button" class="b sm" id="cpw">Copy</button></div>`;q('#cpw').onclick=()=>copy(r.password)}};
  if(q('#rl'))q('#rl').onclick=async()=>{if(!await dialog({title:u.isAdmin?'Remove admin access?':'Make this person an admin?',text:u.isAdmin?`${esc(name)} will lose access to this panel.`:`${esc(name)} will be able to see and change everything here, including money.`,ok:u.isAdmin?'Remove admin':'Make admin',danger:!u.isAdmin?0:1}))return;
    if(await act(()=>api(`/admin/users/${id}/role`,{isAdmin:!u.isAdmin}),'Role updated'))refresh()};
  if(q('#del'))q('#del').onclick=async()=>{const v=await dialog({title:'Delete this account?',text:`Type <b>${esc(name)}</b> to confirm. This cannot be undone.`,ok:'Delete account',danger:1,html:'<div class="f"><input name="c" autocomplete="off" aria-label="Type the username to confirm"></div>',validate:v=>v.c.trim()!==name?'The name does not match':''});if(!v)return;
    if(await act(()=>api(`/admin/users/${id}/delete`,{}),'Account deleted')){closeDrawer();if(R.cur==='users')V.users.refresh();else route()}};
}

// ---------- submissions ----------
V.submissions=async live=>{
  const st=S.submissions;
  $('#view').innerHTML=pagehead('Submissions','Read what people wrote. Remove a bad submission so they can try again.')+`<div class="card"><div class="row" style="margin-bottom:14px">${seg([['','Everything'],['survey','Surveys'],['app','App tests'],['video','Videos']],st.type,'st')}<div class="grow"><input id="sq" type="search" placeholder="Search by person or words in the answer" value="${esc(st.q)}" aria-label="Search submissions"></div></div><div class="tw" id="sl"></div><div class="pager" id="sp"></div></div>`;
  let items=[];
  const load=async()=>{const d=await api('/admin/submissions?'+new URLSearchParams(st));if(!live())return;items=d.items;
    $('#sl').innerHTML=d.items.length?`<table><thead><tr><th>Person</th><th>Task</th><th>Answer</th><th class="num">Reward</th><th>When</th><th></th></tr></thead><tbody>${d.items.map((e,i)=>`<tr><td><div class="who"><span class="av">${e.user?ini(e.user):'?'}</span><b>${nm(e.user)}</b></div></td><td><div class="cut" style="max-width:220px"><b>${esc(e.task?.title||'(deleted task)')}</b></div><span class="badge">${TYPE[e.task?.type]||'Task'}</span></td><td><div class="cut" title="${esc(e.answer)}">${e.answer==='watched'?'<span class="mu">Watched to the end</span>':esc(e.answer)}</div></td><td class="num">${e.task?usdS(e.task.rewardKes||0):''}</td><td>${ago(e.createdAt)}</td><td class="row" style="flex-wrap:nowrap"><button type="button" class="b sm" data-read="${i}">Read</button><button type="button" class="b sm soft" data-rev="${i}">Remove</button></td></tr>`).join('')}</tbody></table>`:empty('Nothing here yet','Submissions show up as people complete tasks.');
    pager($('#sp'),d,'submissions',p=>{st.page=p;load()})};
  bindSeg('st',v=>{st.type=v;st.page=1;load()});$('#sq').oninput=debounce(e=>{st.q=e.target.value.trim();st.page=1;load()});
  $('#sl').onclick=async e=>{
    const r=e.target.closest('[data-read]');if(r){const s=items[+r.dataset.read];await dialog({title:esc(s.task?.title||'Submission'),text:`${nm(s.user)} · ${date(s.createdAt)}`,ok:'Close',html:`<div class="card" style="white-space:pre-wrap;margin-bottom:6px">${esc(s.answer)}</div>`});return}
    const v=e.target.closest('[data-rev]');if(!v)return;const s=items[+v.dataset.rev];
    const o=await dialog({title:'Remove this submission?',text:`${nm(s.user)} will be able to do this task again.`,ok:'Remove',danger:1,html:`<label class="row" style="font-weight:600;gap:10px"><input type="checkbox" name="refund" checked> Take the reward (${s.task?usdS(s.task.rewardKes||0):'0'}) back from their balance</label>`});
    if(!o)return;const r2=await act(()=>api(`/admin/submissions/${s._id}/revoke`,{refund:o.refund}));if(r2){toast(r2.takenKes?`Removed and took back ${usdS(r2.takenKes)}`:'Removed');load()}};
  await load();
};

// ---------- referrals + leaderboard ----------
V.referrals=async live=>{
  const all=await api('/admin/referrals');if(!live())return;
  $('#view').innerHTML=pagehead('Referrals','Everyone who joined with an invite link.')+`<div class="card"><div class="row" style="margin-bottom:14px"><div class="grow"><input id="rq" type="search" placeholder="Search by name or email" aria-label="Search referrals"></div></div><div class="tw" id="rt"></div></div>`;
  const draw=()=>{const q=$('#rq').value.trim().toLowerCase(),a=all.filter(x=>!q||[x.username,x.email,x.referredBy?.username,x.referredBy?.email].some(s=>String(s||'').toLowerCase().includes(q)));
    $('#rt').innerHTML=a.length?`<table><thead><tr><th>Account</th><th>Invited by</th><th>Country</th><th>Joined</th><th>Status</th></tr></thead><tbody>${a.map(x=>`<tr class="click" data-u="${x._id}"><td><div class="who"><span class="av">${ini(x)}</span><div><b>${nm(x)}</b><small>${esc(x.email)}</small></div></div></td><td>${x.referredBy?esc(x.referredBy.username||x.referredBy.email):'<span class="mu">Account deleted</span>'}</td><td>${flag(x.country)} ${esc(cname(x.country))}</td><td>${date(x.createdAt)}</td><td>${badge(x)}</td></tr>`).join('')}</tbody></table>`:empty('No referred accounts','Accounts created with an invite link appear here.')};
  $('#rq').oninput=draw;$('#rt').onclick=e=>{const r=e.target.closest('[data-u]');if(r)openUser(r.dataset.u)};draw();
};
V.leaderboard=async live=>{
  const l=await api('/admin/leaderboard');if(!live())return;
  const box=(t,rows,val)=>`<div class="card"><h3>${t}</h3><ul class="list">${rows.map((u,i)=>`<li><span class="rk r${i+1}">${i+1}</span><span class="av">${ini(u)}</span><div class="grow"><b>${nm(u)}</b><small>${flag(u.country)} ${esc(cname(u.country))}</small></div><b>${val(u)}</b></li>`).join('')||'<li class="mu">Nothing to rank yet</li>'}</ul></div>`;
  $('#view').innerHTML=pagehead('Leaderboard','Your top 20 in each list.')+`<div class="g3">${box('Highest balances',l.richest,u=>usdS(u.balanceKes||0))}${box('Most tasks completed',l.workers,u=>u.n+' tasks')}${box('Top inviters',l.referrers,u=>u.n+' invited')}</div>`;
};


// ---------- support chat: list of people on the left, the conversation on the right (one screen at a time on a phone) ----------
V.chats=async live=>{
  const st=S.chats||(S.chats={q:'',tab:'all',id:null});
  $('#view').innerHTML=pagehead('Support chat','Messages from your users. Pick a person to reply.')+`<div class="mc-admin" id="mca" data-view="${st.id?'chat':'list'}">
   <aside class="mc-list"><div class="mc-lh"><h3>Chats</h3><input id="mcq" type="search" placeholder="Search a username or Gmail" aria-label="Search chats" value="${esc(st.q)}">
    <div class="mc-tabs"><button type="button" data-t="all">All</button><button type="button" data-t="un">Unread</button></div></div><ul class="mc-rows" id="mcr"></ul></aside>
   <section class="mc-conv" id="mcc"></section></div>`;
  const root=$('.mc-admin'),rows=$('#mcr'),conv=$('#mcc');let data=[],pn=null;
  const when=d=>{const x=new Date(d);return x.toDateString()===new Date().toDateString()?MC.hm(d):x.toLocaleDateString(undefined,{day:'numeric',month:'short'})};
  const tabs=()=>$$('.mc-tabs button',root).forEach(b=>b.classList.toggle('on',b.dataset.t===st.tab));
  const drawList=()=>{const L=st.tab==='un'?data.filter(c=>c.unread):data;
    rows.innerHTML=L.length?L.map(c=>`<li><button type="button" class="mc-row${c.unread?' un':''}${st.id===c.user._id?' on':''}" data-id="${c.user._id}"><span class="mc-pa">${ini(c.user)}</span><b>${nm(c.user)}</b><time>${c.last?when(c.last.at):''}</time><small>${c.last?(c.last.from==='admin'?'You: ':'')+(c.last.del?'Message deleted':esc(c.last.text)):'Start a conversation'}</small>${c.unread?`<span class="mc-n">${c.unread}</span>`:'<span></span>'}</button></li>`).join(''):`<li class="mc-lnone">${st.tab==='un'?'No unread chats.':st.q?'No one matches that search.':'No messages yet. When a user writes from the chat button, they show up here.'}</li>`;tabs()};
  const refresh=async()=>{try{const d=await api('/admin/chats?'+new URLSearchParams({q:st.q,fresh:1}),undefined,1);if(!live())return;data=d.chats;drawList();chatBadge(data.reduce((n,c)=>n+c.unread,0))}catch(e){if(live()&&!data.length)rows.innerHTML=`<li class="mc-lnone">${esc(e.message)}</li>`}};
  const blank=()=>{if(pn)pn.stop();pn=null;st.id=null;root.dataset.view='list';conv.innerHTML=`<div class="mc-empty"><span class="mc-ico"></span><b>Pick a chat</b><small>Choose a person on the left to read and reply.</small></div>`;drawList()};
  const openChat=id=>{const c=data.find(x=>x.user._id===id);if(!c)return;const u=c.user;if(pn)pn.stop();st.id=id;root.dataset.view='chat';
    conv.innerHTML=`<header class="mc-ch"><button type="button" class="mc-ib mc-back" aria-label="Back to chats">${ICON.back||'<svg class="i" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>'}</button><span class="mc-pa">${ini(u)}</span>
      <div><b>${nm(u)}</b><small>${flag(u.country)} ${esc(cname(u.country))} &middot; joined ${date(u.createdAt)}${u.banned?' &middot; banned':''}</small></div>
      <button type="button" class="mc-ib" id="mcu" aria-label="View user details" title="View user details">${ICON.user}</button></header>`;
    pn=MC.pane({side:'a',base:'/admin/chats/'+id,other:u.username||u.email,every:2500,onRead:refresh});conv.appendChild(pn.el);pn.start();drawList();
    $('.mc-back',conv).onclick=blank;$('#mcu',conv).onclick=()=>openUser(id);if(!coarse())pn.focus()};
  const coarse=()=>matchMedia('(pointer:coarse)').matches;
  rows.onclick=e=>{const b=e.target.closest('.mc-row');if(b)openChat(b.dataset.id)};
  $('.mc-tabs',root).onclick=e=>{const b=e.target.closest('button');if(b){st.tab=b.dataset.t;drawList()}};
  $('#mcq').oninput=debounce(e=>{st.q=e.target.value;refresh()},300);
  await refresh();if(!live())return;
  if(st.id&&data.some(x=>x.user._id===st.id))openChat(st.id);else blank();
  const t=setInterval(()=>{if(!live()){clearInterval(t);if(pn)pn.stop();return}if(!document.hidden)refresh()},4000);
};

// ---------- tasks ----------
const selT=new Set();
V.tasks=async live=>{
  const st=S.tasks;selT.clear();
  $('#view').innerHTML=pagehead('Manage tasks','Everything you posted. Videos play in the order shown when you filter to Videos.',`<a class="b" href="#/videos">${ICON.video}Add videos</a><a class="b pri" href="#/create">${ICON.plus}Add survey or app</a>`)+`<div class="card"><div class="row" style="margin-bottom:14px">${seg([['','All'],['video','Videos'],['survey','Surveys'],['app','App tests']],st.type,'tt')}<div class="grow"><input id="tq" type="search" placeholder="Search tasks" value="${esc(st.q)}" aria-label="Search tasks"></div><select id="ts" style="width:auto" aria-label="Status"><option value="">Live and hidden</option><option value="live">Live only</option><option value="hidden">Hidden only</option></select></div>
   <div class="bulk" id="tb" hidden><span id="tbn"></span><button type="button" class="b sm" data-ba="show">Show</button><button type="button" class="b sm" data-ba="hide">Hide</button><button type="button" class="b sm soft" data-ba="delete">Delete</button><button type="button" class="b sm" data-ba="clear">Clear</button></div><div class="tw" id="tl"></div></div>`;
  $('#ts').value=st.status;let rows=[];
  const bulkUI=()=>{$('#tb').hidden=!selT.size;$('#tbn').textContent=selT.size+' selected'};
  const load=async()=>{const d=await api('/admin/tasks?'+new URLSearchParams({type:st.type,q:st.q}));if(!live())return;
    rows=d.filter(t=>!st.status||(st.status==='live')===(t.active!==false));const ord=st.type==='video';
    $('#tl').innerHTML=rows.length?`<table><thead><tr><th><input type="checkbox" id="ta" aria-label="Select all"></th>${ord?'<th>Order</th>':''}<th>Task</th><th>Type</th><th class="num">Reward</th><th class="num">Finished</th><th>Status</th><th></th></tr></thead><tbody>${rows.map((t,i)=>`<tr><td><input type="checkbox" data-s="${t._id}" ${selT.has(t._id)?'checked':''} aria-label="Select ${esc(t.title)}"></td>
     ${ord?`<td><div class="row" style="gap:2px;flex-wrap:nowrap"><b style="width:24px">${i+1}</b><button type="button" class="b sm ic" data-mv="up" data-id="${t._id}" ${i===0?'disabled':''} aria-label="Move earlier">${ICON.up}</button><button type="button" class="b sm ic" data-mv="down" data-id="${t._id}" ${i===rows.length-1?'disabled':''} aria-label="Move later">${ICON.down}</button></div></td>`:''}
     <td><div class="who">${t.videoId?`<img class="thumb" loading="lazy" alt="" src="https://i.ytimg.com/vi/${esc(t.videoId)}/default.jpg">`:''}<div style="min-width:0"><b class="cut" style="max-width:300px">${esc(t.title)}</b>${t.description?`<small class="cut" style="max-width:300px">${esc(t.description)}</small>`:''}</div></div></td><td><span class="badge">${TYPE[t.type]||t.type}</span></td><td class="num">${$m(t.rewardKes||0)}</td><td class="num">${t.finished}</td><td>${t.active===false?'<span class="badge no">Hidden</span>':'<span class="badge ok">Live</span>'}</td>
     <td><div class="row" style="flex-wrap:nowrap"><button type="button" class="b sm" data-ed="${i}">${ICON.edit}Edit</button><button type="button" class="b sm" data-tg="${t._id}">${t.active===false?'Show':'Hide'}</button><button type="button" class="b sm soft" data-dl="${i}" aria-label="Delete ${esc(t.title)}">${ICON.trash}</button></div></td></tr>`).join('')}</tbody></table>`:empty('No tasks here','Add videos, surveys or app tests and they show up in this list.');bulkUI()};
  bindSeg('tt',v=>{st.type=v;selT.clear();load()});$('#tq').oninput=debounce(e=>{st.q=e.target.value.trim();load()});$('#ts').onchange=e=>{st.status=e.target.value;load()};
  const delMsg=n=>`Users who already finished ${n>1?'them':'it'} keep their reward. This cannot be undone.`;
  $('#tl').onclick=async e=>{const t=e.target;
    if(t.id==='ta'){$$('[data-s]',$('#tl')).forEach(c=>{c.checked=t.checked;t.checked?selT.add(c.dataset.s):selT.delete(c.dataset.s)});bulkUI();return}
    const c=t.closest('[data-s]');if(c){c.checked?selT.add(c.dataset.s):selT.delete(c.dataset.s);bulkUI();return}
    const mv=t.closest('[data-mv]');if(mv){if(await act(()=>api(`/admin/tasks/${mv.dataset.id}/move`,{dir:mv.dataset.mv})))load();return}
    const tg=t.closest('[data-tg]');if(tg){if(await act(()=>api(`/admin/tasks/${tg.dataset.tg}/toggle`,{}),'Updated'))load();return}
    const dl=t.closest('[data-dl]');if(dl){const k=rows[+dl.dataset.dl];if(!await dialog({title:'Delete this task?',text:`“${esc(k.title)}”. ${delMsg(1)}`,ok:'Delete',danger:1}))return;if(await act(()=>api(`/admin/tasks/${k._id}/delete`,{}),'Task deleted'))load();return}
    const ed=t.closest('[data-ed]');if(ed)editTask(rows[+ed.dataset.ed],load)};
  $('#tb').onclick=async e=>{const b=e.target.closest('[data-ba]');if(!b)return;const a=b.dataset.ba,ids=[...selT];if(a==='clear'){selT.clear();return load()}
    if(a==='delete'&&!await dialog({title:`Delete ${ids.length} task${ids.length>1?'s':''}?`,text:delMsg(ids.length),ok:'Delete',danger:1}))return;
    if(await act(()=>api('/admin/tasks/bulk',{ids,action:a}),'Done')){selT.clear();load()}};
  await load();
};
async function editTask(t,done){
  const vid=t.type==='video',v=await dialog({title:'Edit '+(TYPE[t.type]||'task').toLowerCase(),ok:'Save changes',validate:v=>!v.title.trim()?'Add a title':!(+v.rewardKes>=0)||v.rewardKes===''?'Enter the reward in KES':'',
   html:`<div class="f"><label for="et">Title</label><input id="et" name="title" maxlength="140" value="${esc(t.title)}"></div><div class="f"><label for="ed">Description</label><textarea id="ed" name="description" maxlength="600">${esc(t.description||'')}</textarea></div>
   <div class="row"><div class="f grow"><label for="er">Reward in KES</label><input id="er" name="rewardKes" type="number" min="0" step="any" value="${t.rewardKes||0}"></div>${vid?`<div class="f grow"><label for="el">Length in seconds</label><input id="el" name="durationSec" type="number" min="0" value="${t.durationSec||''}"></div>`:`<div class="f grow" style="flex:2"><label for="eu">Link</label><input id="eu" name="url" type="url" value="${esc(t.url||'')}"></div>`}</div>`});
  if(!v)return;const body={title:v.title,description:v.description,rewardKes:+v.rewardKes};if(vid)body.durationSec=+v.durationSec||0;else body.url=v.url;
  if(await act(()=>api(`/admin/tasks/${t._id}/update`,body),'Saved'))done();
}

// ---------- add videos + add survey/app ----------
V.videos=async live=>{
  $('#view').innerHTML=pagehead('Add videos','Paste YouTube links, set a reward, and they join the queue.')+`<div class="g21"><div class="card"><form id="vf" novalidate>
   <div class="f"><label for="vl">YouTube links</label><textarea id="vl" name="links" rows="7" placeholder="https://www.youtube.com/watch?v=...&#10;https://youtu.be/...&#10;https://youtu.be/... | Your own title"></textarea><p class="hint">One per line. Titles fill in by themselves. Add <b>| title</b> after a link to use your own.</p><div class="pv" id="pv"></div></div>
   <div class="f"><label for="vd">Description (shown to users)</label><textarea id="vd" name="description" maxlength="600" placeholder="What should they pay attention to?"></textarea></div>
   <div class="row"><div class="f grow"><label for="vr">Reward per video in KES</label><input id="vr" name="rewardKes" type="number" min="0" step="any"><p class="hint" id="vh"></p></div><div class="f grow"><label for="vs">Video length in seconds (optional)</label><input id="vs" name="durationSec" type="number" min="0"></div></div>
   <p class="hint" style="margin:-6px 0 12px">Users must watch 85% of the length before the reward is paid. Leave it empty to use the length the player reports.</p><p class="err" role="alert"></p><button type="submit" class="b pri" id="vb">${ICON.plus}Add videos</button></form></div>
   <div class="card"><h3>How videos work</h3><ul class="list"><li>Videos play in the order you add them. You can reorder them in Manage tasks.</li><li>When a video ends, the reward goes into the user's balance.</li><li>Each video pays once per person.</li><li>Skipping ahead does not count. The server checks the time passed.</li><li>New videos appear for people who finished the old ones.</li></ul></div></div>`;
  const pv=()=>{const seen=new Set(),L=$('#vl').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,100);
    $('#pv').innerHTML=L.map(l=>{const [link,...t]=l.split('|'),id=ytId(link);if(!id)return `<div class="bad">${ICON.ban}<span class="cut">Not a YouTube link: ${esc(l.slice(0,60))}</span></div>`;
      const dup=seen.has(id);seen.add(id);return `<div><img class="thumb" alt="" src="https://i.ytimg.com/vi/${id}/default.jpg"><span class="grow cut">${esc(t.join('|').trim()||'Title will be fetched')}</span>${dup?'<span class="badge">Repeat</span>':'<span class="badge ok">Ready</span>'}</div>`}).join('')};
  $('#vl').oninput=debounce(pv,150);$('#vr').oninput=e=>$('#vh').textContent=+e.target.value>0?`About ${usdS(+e.target.value)} per user`:'';
  $('#vf').onsubmit=async e=>{e.preventDefault();const er=$('.err',e.target);er.textContent='';const b=$('#vb');b.disabled=true;
    try{const f=Object.fromEntries(new FormData(e.target));f.rewardKes=+f.rewardKes;f.durationSec=+f.durationSec||0;const r=await api('/admin/videos',f);e.target.reset();$('#pv').innerHTML='';$('#vh').textContent='';
      toast(`Added ${r.added} video${r.added===1?'':'s'}`+(r.duplicates?`, ${r.duplicates} already posted`:'')+(r.skipped.length?`, ${r.skipped.length} skipped`:''))}catch(x){er.textContent=x.message}finally{b.disabled=false}};
};
V.create=async live=>{
  $('#view').innerHTML=pagehead('Add survey or app','Post a task that needs a written answer.')+`<div class="g21"><div class="card"><form id="tf" novalidate>
   <div class="f"><label for="ti">Title</label><input id="ti" name="title" maxlength="140"></div>
   <div class="row"><div class="f grow"><label for="ty">Type</label><select id="ty" name="type"><option value="survey">Survey</option><option value="app">App testing</option></select></div><div class="f grow"><label for="rw">Reward in KES</label><input id="rw" name="rewardKes" type="number" min="0" step="any"><p class="hint" id="rh"></p></div></div>
   <div class="f"><label for="ds">Description (shown to users)</label><textarea id="ds" name="description" maxlength="600" placeholder="What should they do?"></textarea></div>
   <div class="f"><label for="ur">Link</label><input id="ur" name="url" type="url" placeholder="https://"></div><p class="err" role="alert"></p><button type="submit" class="b pri">Publish task</button></form></div>
   <div class="card"><h3>Tips</h3><ul class="list"><li>Say what a good answer looks like in the description.</li><li>People need at least five characters to submit.</li><li>Read their answers in Submissions. You can remove weak ones.</li></ul></div></div>`;
  $('#rw').oninput=e=>$('#rh').textContent=+e.target.value>0?`About ${usdS(+e.target.value)} per user`:'';
  $('#tf').onsubmit=async e=>{e.preventDefault();const er=$('.err',e.target);er.textContent='';try{const f=Object.fromEntries(new FormData(e.target));f.rewardKes=+f.rewardKes;await api('/admin/tasks',f);e.target.reset();$('#rh').textContent='';toast('Task published')}catch(x){er.textContent=x.message}};
};

// ---------- ledger + audit ----------
V.ledger=async live=>{
  const st=S.ledger;
  $('#view').innerHTML=pagehead('Money ledger','Every time a balance changed, newest first.')+`<div class="kpis" id="lk"></div><div class="card"><div class="row" style="margin-bottom:14px"><select id="lkd" style="width:auto" aria-label="Type"><option value="">All types</option>${Object.entries(KIND).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><div class="grow"><input id="lq" type="search" placeholder="Search by person" value="${esc(st.q)}" aria-label="Search ledger"></div></div><div class="tw" id="ll"></div><div class="pager" id="lp"></div></div>`;
  $('#lkd').value=st.kind;
  const load=async()=>{const d=await api('/admin/transactions?'+new URLSearchParams(st));if(!live())return;
    $('#lk').innerHTML=`<div class="kpi"><div class="kh"><span class="ki">${ICON.wallet}</span>Paid out</div><b>${usdS(d.paidKes)}</b><div class="sub">${Math.round(d.paidKes).toLocaleString()} KES in matching entries</div></div><div class="kpi bad"><div class="kh"><span class="ki">${ICON.minus}</span>Taken back</div><b>${usdS(Math.abs(d.removedKes))}</b><div class="sub">Adjustments and revoked rewards</div></div><div class="kpi sun"><div class="kh"><span class="ki">${ICON.layers}</span>Entries</div><b>${d.total.toLocaleString()}</b><div class="sub">Matching your filters</div></div>`;
    $('#ll').innerHTML=d.items.length?`<table><thead><tr><th>When</th><th>Person</th><th>Type</th><th>Note</th><th class="num">Amount</th></tr></thead><tbody>${d.items.map(t=>`<tr><td>${date(t.createdAt)}<small style="display:block">${new Date(t.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small></td><td><b>${esc(t.user)}</b></td><td><span class="badge">${KIND[t.kind]||esc(t.kind)}</span></td><td><div class="cut" style="max-width:300px">${esc(t.note)}</div></td><td class="num"><span class="${t.amountKes<0?'neg':'pos'}">${t.amountKes<0?'-':'+'}${usdS(Math.abs(t.amountKes))}</span><small style="display:block">${Math.round(t.amountKes).toLocaleString()} KES</small></td></tr>`).join('')}</tbody></table>`:empty('No entries','Rewards, bonuses and adjustments appear here.');
    pager($('#lp'),d,'entries',p=>{st.page=p;load()})};
  $('#lkd').onchange=e=>{st.kind=e.target.value;st.page=1;load()};$('#lq').oninput=debounce(e=>{st.q=e.target.value.trim();st.page=1;load()});await load();
};
V.audit=async live=>{
  const st=S.audit;
  $('#view').innerHTML=pagehead('Audit log','What admins changed, and when.')+`<div class="card"><div class="tw" id="al"></div><div class="pager" id="ap"></div></div>`;
  const load=async()=>{const d=await api('/admin/audit?page='+st.page);if(!live())return;
    $('#al').innerHTML=d.items.length?`<table><thead><tr><th>When</th><th>Admin</th><th>Action</th><th>On</th><th>Details</th></tr></thead><tbody>${d.items.map(a=>`<tr><td>${ago(a.createdAt)}<small style="display:block">${new Date(a.createdAt).toLocaleString()}</small></td><td><b>${esc(a.adminName)}</b></td><td><span class="badge">${esc(a.action.replace(/[.-]/g,' '))}</span></td><td>${esc(a.target)}</td><td><div class="cut">${esc(a.detail)}</div></td></tr>`).join('')}</tbody></table>`:empty('No admin actions yet','Changes made in this panel are recorded here.');
    pager($('#ap'),d,'actions',p=>{st.page=p;load()})};await load();
};

// ---------- settings ----------
V.settings=async live=>{
  const s=await api('/admin/settings');if(!live())return;
  $('#view').innerHTML=pagehead('Settings','Changes apply to the whole site straight away.')+`<div class="g2">
   <div class="card"><h3>Site banner</h3><form data-f="banner"><div class="f"><label for="bt">Message at the top of every page</label><input id="bt" name="announcement" maxlength="200" value="${esc(s.announcement)}" placeholder="Leave empty to hide the banner"><p class="hint"><span id="bc">0</span>/200 characters</p></div><div class="f"><div class="banner-prev" id="bp"></div></div><p class="err"></p><button class="b pri" type="submit">Save banner</button></form></div>
   <div class="card"><h3>Payout day</h3><form data-f="payout"><div class="f"><label for="pd">Date shown to users</label><input id="pd" name="payoutDate" type="date" value="${esc(String(s.payoutDate).slice(0,10))}"><p class="hint">Clear the date to show “Not announced yet”.</p></div><p class="err"></p><button class="b pri" type="submit">Save date</button></form></div>
   <div class="card"><h3>Invite rewards</h3><form data-f="rewards"><div class="row"><div class="f grow"><label for="rr">Inviter earns (KES)</label><input id="rr" name="referrerKes" type="number" min="0" step="any" value="${s.referrerKes}"><p class="hint" id="rrh"></p></div><div class="f grow"><label for="rj">New member starts with (KES)</label><input id="rj" name="joinKes" type="number" min="0" step="any" value="${s.joinKes}"><p class="hint" id="rjh"></p></div></div><p class="err"></p><button class="b pri" type="submit">Save rewards</button></form></div>
   <div class="card"><h3>Sign-ups</h3><div class="row sp" style="margin-bottom:12px"><div><b>Let new people join</b><p class="mu">Turn this off to pause registrations. Existing members are not affected.</p></div><label class="sw"><span class="sr">Allow sign-ups</span><input type="checkbox" id="so2" ${s.signupsOpen?'checked':''}><i></i></label></div>
    <h3 style="margin:18px 0 8px">Data</h3><button type="button" class="b" id="ex2">${ICON.download}Download all users (CSV)</button></div>
   <div class="card"><h3>Wallpaper picture</h3><p class="mu" style="margin-bottom:12px">Shows behind the top of the landing page and on the login page. A wide picture works best.</p>
    <div class="wallprev" id="wp">${s.hasWallpaper?`<img src="/wallpaper?v=${esc(s.wallpaperV)}" alt="Current wallpaper">`:'<span>No wallpaper yet. The plain green background is showing.</span>'}</div>
    <div class="f"><label for="wf">Choose a picture (JPG, PNG or WebP)</label><input id="wf" type="file" accept="image/jpeg,image/png,image/webp"></div>
    <p class="err" id="we"></p><div class="row"><button type="button" class="b pri" id="wu" disabled>Upload wallpaper</button><button type="button" class="b" id="wr" ${s.hasWallpaper?'':'disabled'}>Remove wallpaper</button></div></div>
   <div class="card"><h3>Admin password</h3><form id="gf"><div class="f"><label for="gcur">Current admin password</label><input id="gcur" name="current" type="password" autocomplete="current-password"></div>
    <div class="row"><div class="f grow"><label for="gnew">New admin password</label><input id="gnew" name="password" type="password" autocomplete="new-password"></div><div class="f grow"><label for="gnew2">Type it again</label><input id="gnew2" name="confirm" type="password" autocomplete="new-password"></div></div>
    <p class="err" id="ge"></p><button class="b pri" type="submit">Change admin password</button></form></div></div>`;
  const prev=()=>{const t=$('#bt').value.trim();$('#bc').textContent=$('#bt').value.length;$('#bp').textContent=t||'The banner is hidden';$('#bp').style.opacity=t?1:.5};$('#bt').oninput=prev;prev();
  const hint=(i,h)=>{const f=()=>$(h).textContent=+$(i).value>0?`About ${usdS(+$(i).value)}`:'';$(i).oninput=f;f()};hint('#rr','#rrh');hint('#rj','#rjh');
  $$('form[data-f]').forEach(f=>f.onsubmit=async e=>{e.preventDefault();const er=$('.err',f);er.textContent='';try{await api('/admin/settings',Object.fromEntries(new FormData(f)));toast('Saved')}catch(x){er.textContent=x.message}});
  $('#so2').onchange=async e=>{if(!await act(()=>api('/admin/settings',{signupsOpen:e.target.checked}),e.target.checked?'Sign-ups are open':'Sign-ups are paused'))e.target.checked=!e.target.checked};
  $('#ex2').onclick=()=>act(()=>download('/admin/users.csv','mawie-users.csv'),'Export downloaded');
  // wallpaper: shrink the picture in the browser first so the upload stays small
  const shrink=async f=>{const bm=await createImageBitmap(f),k=Math.min(1,1600/bm.width),c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);
    c.getContext('2d').drawImage(bm,0,0,c.width,c.height);
    // WebP is the smallest. A browser that cannot make WebP gives JPEG instead. The server accepts up to 600 KB; this aims well under that.
    const enc=(type,q)=>new Promise(res=>c.toBlob(b=>{if(!b)return res(null);const fr=new FileReader();fr.onload=()=>res({url:fr.result,type:b.type,size:b.size});fr.readAsDataURL(b)},type,q));
    for(const q of [.74,.6,.45]){const o=await enc('image/webp',q);const w=o&&o.type==='image/webp'?o:await enc('image/jpeg',q);if(w&&w.size<=560*1024)return w.url}
    throw new Error('too big')};
  let pick=null;
  $('#wf').onchange=async e=>{const f=e.target.files[0];$('#we').textContent='';$('#wu').disabled=true;pick=null;if(!f)return;
    try{pick=await shrink(f);$('#wp').innerHTML=`<img src="${pick}" alt="Preview of the new wallpaper">`;$('#wu').disabled=false}catch(x){$('#we').textContent=x&&x.message==='too big'?'That picture is too detailed. Try a simpler or smaller one.':'That file could not be read as a picture'}};
  $('#wu').onclick=async()=>{if(!pick)return;$('#wu').disabled=true;try{await api('/admin/wallpaper',{image:pick});toast('Wallpaper saved');V.settings(live)}catch(x){$('#we').textContent=x.message;$('#wu').disabled=false}};
  $('#wr').onclick=()=>act(async()=>{await api('/admin/wallpaper/remove',{});V.settings(live)},'Wallpaper removed');
  $('#gf').onsubmit=async e=>{e.preventDefault();const er=$('#ge');er.textContent='';try{await api('/admin/gate/change',Object.fromEntries(new FormData(e.target)));e.target.reset();toast('Admin password changed')}catch(x){er.textContent=x.message}};
};

// ---------- command palette ----------
let palI=0,palItems=[];
const cmds=q=>{const L=[...ROUTES.map(r=>({t:r.t,s:'Go to page',i:r.i,f:()=>go(r.id)})),
  {t:'Toggle dark mode',s:'Command',i:'moon',f:toggleTheme},{t:'Download users (CSV)',s:'Command',i:'download',f:()=>act(()=>download('/admin/users.csv','mawie-users.csv'),'Export downloaded')},
  {t:'View the site',s:'Command',i:'home',f:()=>location='/dashboard.html'},{t:'Log out',s:'Command',i:'logout',f:logout}];
  const m=q?L.filter(c=>c.t.toLowerCase().includes(q.toLowerCase())):L;
  if(q)m.unshift({t:`Find user “${q}”`,s:'Users',i:'users',f:()=>{S.users={...S.users,q,page:1};location.hash==='#/users'?route():go('users')}},{t:`Search submissions for “${q}”`,s:'Submissions',i:'inbox',f:()=>{S.submissions={...S.submissions,q,page:1};location.hash==='#/submissions'?route():go('submissions')}});
  return m};
const palDraw=()=>{palItems=cmds($('#palq').value.trim());palI=Math.min(palI,palItems.length-1);$('#pall').innerHTML=palItems.map((c,i)=>`<li data-i="${i}" class="${i===palI?'on':''}">${ICON[c.i]}${esc(c.t)}<small>${c.s}</small></li>`).join('')||'<li class="mu">No matches</li>'};
const palOpen=()=>{pal.classList.add('on');$('#palq').value='';palI=0;palDraw();$('#palq').focus()};
const palClose=()=>pal.classList.remove('on');
const palRun=i=>{const c=palItems[i];palClose();c&&c.f()};
$('#kbar').onclick=palOpen;$('#palq').oninput=()=>{palI=0;palDraw()};
$('#pall').onclick=e=>{const li=e.target.closest('[data-i]');if(li)palRun(+li.dataset.i)};
$('#palq').onkeydown=e=>{if(e.key==='ArrowDown'){palI=(palI+1)%palItems.length;palDraw();e.preventDefault()}else if(e.key==='ArrowUp'){palI=(palI-1+palItems.length)%palItems.length;palDraw();e.preventDefault()}else if(e.key==='Enter')palRun(palI)};
document.addEventListener('mousedown',e=>{if(pal.classList.contains('on')&&!pal.contains(e.target)&&!e.target.closest('#kbar'))palClose()});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();pal.classList.contains('on')?palClose():palOpen();return}
  if(e.key==='Escape'){if(pal.classList.contains('on'))palClose();else if(dlg.classList.contains('on'))closeDlg(null);else if(drawer.classList.contains('on'))closeDrawer();else toggleSide(false)}
  if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){const i=$('#view input[type=search]');if(i){e.preventDefault();i.focus()}}});

route();
};
