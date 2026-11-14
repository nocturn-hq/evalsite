const $=s=>document.querySelector(s);let C=[],CFG={referrerKes:80,joinKes:20};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg=p=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICON={
 eye:svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 eyeOff:svg('<path d="M3 3l18 18"/><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A16.6 16.6 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
 copy:svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
 check:svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
 video:svg('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>'),
 survey:svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
 open:svg('<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>'),
 arrow:svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
 plus:svg('<path d="M12 5v14M5 12h14"/>'),
 wallet:svg('<path d="M3 7a2 2 0 0 1 2-2h12v4"/><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14" r="1"/>'),
 users:svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>'),
 user:svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
 globe:svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
 shield:svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5L16 9.5"/>'),
 lock:svg('<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
 key:svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>'),
 zap:svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
 clock:svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
 gift:svg('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z"/>'),
 trophy:svg('<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 21h8M10 18h4"/>'),
 trend:svg('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
 coins:svg('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'),
 dollar:svg('<path d="M12 3v18M16.5 7.5C15.8 6.5 14.2 6 12.5 6 10 6 8.5 7.2 8.5 9s1.5 2.5 3.5 3 3.5 1.2 3.5 3-1.5 3-4 3c-1.8 0-3.3-.6-4-1.7"/>'),
 mail:svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>'),
 star:svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
 calendar:svg('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
 chart:svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
 bell:svg('<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
 link:svg('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'),
 sparkle:svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4"/>'),
 message:svg('<path d="M4 5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>'),
 send:svg('<path d="M21 3L3 10.5l6.5 2.5L12 20l3-5 6-12z"/>'),
 inbox:svg('<path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1 3h6l1-3h5"/>'),
 layers:svg('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
 activity:svg('<path d="M3 12h4l3-8 4 16 3-8h4"/>'),
 ban:svg('<circle cx="12" cy="12" r="9"/><path d="M5.7 5.7l12.6 12.6"/>'),
 phone:svg('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
 play:svg('<path d="M8 5l11 7-11 7z"/>'),
 skip:svg('<path d="M5 5l9 7-9 7zM19 5v14"/>'),
 checkc:svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>')};

// fill every <i data-i="name"> with its icon
const hydrate=(root=document)=>root.querySelectorAll('[data-i]').forEach(e=>{if(!e.firstChild)e.innerHTML=ICON[e.dataset.i]||''});
hydrate();
const yr=document.getElementById('yr');if(yr)yr.textContent=new Date().getFullYear();

const _call=async(p,b,quiet)=>{const r=await fetch('/api'+p,{method:b?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(localStorage.t||''),'x-gate':sessionStorage.gateT||''},body:b?JSON.stringify(b):undefined});
  const j=await r.json().catch(()=>{throw new Error(r.status===404?'The server does not have this feature yet. It is running older code. Stop it and start it again with npm start.':'The server sent an unexpected reply (status '+r.status+').')});if(!r.ok){if(j.gate&&document.body.dataset.p==='adminx'&&!quiet){sessionStorage.removeItem('gateT');const last=+sessionStorage.gateR||0;if(Date.now()-last>5000){sessionStorage.gateR=Date.now();location.reload()}throw new Error(j.error)}if(r.status===401&&!['home','login','signup'].includes(document.body.dataset.p))location='/login.html?next='+encodeURIComponent(location.pathname+location.hash);throw new Error(j.error||'Something went wrong')}return j};
// Admin answers are kept for 20 seconds, and any change (a POST) clears them. Going back to a page, or hovering a menu item first, feels instant.
const _gc=new Map(),_clone=x=>typeof structuredClone==='function'?structuredClone(x):x;
const api=(p,b,quiet)=>{
  if(b){_gc.clear();return _call(p,b,quiet)}
  if(!/^\/(admin\/|me$)/.test(p)||/[?&]fresh=/.test(p))return _call(p,b,quiet);
  const h=_gc.get(p),now=Date.now();if(h&&h.exp>now)return h.pr.then(_clone);
  const pr=_call(p,b,quiet);_gc.set(p,{exp:now+20000,pr});pr.catch(()=>_gc.delete(p));return pr.then(_clone)};

// Dollars first, local-currency estimate below. Amounts are stored in KES.
const usdOf=kes=>kes/C.find(x=>x.iso2==='KE').rate_per_usd;
const local=(usd,c)=>c&&c.currency_code!=='USD'?`≈ ${c.symbol} ${(usd*c.rate_per_usd).toLocaleString(undefined,{maximumFractionDigits:2})} ${c.currency_code}`:'';
const money=(kes,cc)=>{const usd=usdOf(kes),l=local(usd,C.find(x=>x.iso2===cc));
  return `<span class="money"><b>$${usd.toFixed(2)}</b>`+(l?`<small>${l}</small>`:'')+'</span>'};
const countUp=el=>{const t=parseFloat(el.textContent.slice(1));if(matchMedia('(prefers-reduced-motion:reduce)').matches||!t)return;const s=performance.now();(function f(n){const p=Math.min((n-s)/900,1);el.textContent='$'+(t*(1-Math.pow(1-p,3))).toFixed(2);if(p<1)requestAnimationFrame(f)})(s)};
const logout=()=>{localStorage.removeItem('t');location='/'};
const submit=(id,fn)=>$(id).onsubmit=async e=>{e.preventDefault();const f=e.target,er=f.querySelector('.err');if(er)er.textContent='';try{await fn(Object.fromEntries(new FormData(f)))}catch(x){if(er)er.textContent=x.message}};

// show/hide buttons on password fields
document.querySelectorAll('[data-toggle]').forEach(b=>{const i=document.getElementById(b.dataset.toggle);b.innerHTML=ICON.eye;
  b.onclick=()=>{const show=i.type==='password';i.type=show?'text':'password';b.innerHTML=show?ICON.eyeOff:ICON.eye;b.setAttribute('aria-label',show?'Hide password':'Show password')}});

// must match the rules the server enforces
const PW={len:p=>p.length>=8,lower:p=>/[a-z]/.test(p),upper:p=>/[A-Z]/.test(p),num:p=>/\d/.test(p),sym:p=>/[^A-Za-z0-9]/.test(p)};
const pwOk=p=>Object.values(PW).every(t=>t(p));

// ---------- dashboard work area: videos, surveys, app testing ----------
const taskCard=(t,user)=>{const safe=/^https?:\/\//i.test(t.url)?t.url:'#',lab=t.type==='app'?'App testing':'Survey',verb=t.type==='app'?'Open the app':'Open the survey';
 return `<div class="card task"><div class="top"><span class="tag">${ICON[t.type==='app'?'phone':'survey']}${lab}</span><div class="reward">${money(t.rewardKes,user.country)}</div></div><h3>${esc(t.title)}</h3>${t.description?`<p class="tdesc">${esc(t.description)}</p>`:''}<a class="open" href="${esc(safe)}" target="_blank" rel="noopener">${ICON.open}${verb}</a><textarea id="a${t._id}" aria-label="Your feedback" placeholder="${t.type==='app'?'Write what you found while testing':'Write your answers'}"></textarea><button type="button" onclick="evalTask('${t._id}')">Submit</button></div>`};
const emptyBox=(msg)=>`<div class="empty">${ICON.checkc}${msg}</div>`;

let ytReady;const loadYT=()=>ytReady||(ytReady=new Promise(res=>{if(window.YT&&YT.Player)return res();const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.head.appendChild(s);window.onYouTubeIframeAPIReady=res}));

function videos(user,data){
 const box=$('#wvideo');let list=data.items,skipped=new Set(),player=null,timer=null,busy=false;
 const doneN=()=>list.filter(v=>v.done).length;
 const cur=()=>list.find(v=>!v.done&&!skipped.has(v._id))||list.find(v=>!v.done);
 const earned=()=>list.filter(v=>v.done).reduce((n,v)=>n+(v.rewardKes||0),0);
 const sync=()=>{$('#cVideo').textContent=list.length-doneN();$('#sVid').textContent=doneN()+'/'+list.length};
 const say=(t,bad)=>{const m=$('#vmsg');if(m){m.textContent=t;m.className='vmsg'+(bad?' bad':'')}};
 function draw(){
  clearTimeout(timer);if(player){try{player.destroy()}catch{}player=null}sync();
  if(!list.length){box.innerHTML=emptyBox('There are currently no videos available. New videos are published regularly, so please check back later.');return}
  const v=cur(),pct=Math.round(doneN()/list.length*100);
  if(!v||v.done){box.innerHTML=`<div class="card vdone"><div class="vprog"><div><b>${doneN()}</b> of ${list.length} watched</div><div class="bar"><i style="width:100%"></i></div></div>${emptyBox('You have watched every video. New videos appear here when they are added.')}</div>`;return}
  const idx=list.indexOf(v)+1;
  box.innerHTML=`<div class="vwrap"><div class="card vmain">
   <div class="vprog"><div><b>${doneN()}</b> of ${list.length} watched</div><div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div>
   <div class="player" id="player"><button type="button" class="poster" id="vplay" style="background-image:url(https://i.ytimg.com/vi/${esc(v.videoId)}/hqdefault.jpg)" aria-label="Play video"><span class="pbtn">${ICON.play}</span></button></div>
   <div class="vinfo"><div class="top"><span class="tag">${ICON.video}Video ${idx} of ${list.length}</span><div class="reward">${money(v.rewardKes,user.country)}</div></div><h3>${esc(v.title)}</h3>${v.description?`<p class="tdesc">${esc(v.description)}</p>`:''}
   <p class="hint">Watch to the end and the reward is added to your balance automatically.</p><p class="vmsg" id="vmsg" aria-live="polite"></p>
   <div class="vact"><button type="button" class="ghostb" id="vskip">${ICON.skip}Skip for now</button></div></div></div>
   <aside class="card vlist"><h3>Up next</h3><ol>${list.map(x=>`<li class="${x.done?'done':x===v?'now':''}"><span class="vi">${x.done?ICON.check:x===v?ICON.play:ICON.video}</span><span class="vt">${esc(x.title)}</span><span class="vr">${money(x.rewardKes,user.country).replace(/<small>.*?<\/small>/,'')}</span></li>`).join('')}</ol></aside></div>`;
  $('#vskip').onclick=()=>{if(list.filter(x=>!x.done).length<2){say('This is the last video waiting for you.');return}skipped.add(v._id);draw()};
  $('#vplay').onclick=()=>play(v);
 }
 async function play(v){
  $('#player').innerHTML='<div id="ytmount"></div>';say('Loading video...');
  try{await loadYT()}catch{say('The video player could not load. Check your connection and try again.',1);return draw()}
  let started=false;
  player=new YT.Player('ytmount',{videoId:v.videoId,width:'100%',height:'100%',playerVars:{rel:0,playsinline:1,modestbranding:1},events:{
   onReady:e=>{say('');e.target.playVideo()},
   onError:()=>say('This video cannot be played right now. Use "Skip for now" to move on.',1),
   onStateChange:async e=>{
    if(e.data===1&&!started){started=true;try{await api(`/videos/${v._id}/start`,{duration:Math.round(player.getDuration()||0)})}catch(x){say(x.message,1)}}
    if(e.data===0&&!busy){busy=true;try{
      const r=await api(`/videos/${v._id}/complete`,{});v.done=true;
      $('#bal').innerHTML=money(r.balanceKes,user.country);countUp($('#bal .money b'));
      const next=cur();draw();
      $('#vmsg').innerHTML=`${ICON.check} Reward added: ${money(v.rewardKes,user.country).replace(/<small>.*?<\/small>/,'')}. ${next&&!next.done?'Next video starting...':'That was the last one.'}`;$('#vmsg').className='vmsg good';
      if(next&&!next.done)timer=setTimeout(()=>play(next),3500);
    }catch(x){say(x.message,1);started=false}finally{busy=false}}}}});
 }
 draw();
}

const wireTiles=()=>{const show=w=>{document.querySelectorAll('#wtabs button').forEach(b=>{const on=b.dataset.w===w;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});document.querySelectorAll('.wpane').forEach(p=>p.classList.toggle('on',p.id==='w'+w))};
 document.querySelectorAll('#wtabs button').forEach(b=>b.onclick=()=>{show(b.dataset.w);history.replaceState(null,'','#'+b.dataset.w);const p=$('#w'+b.dataset.w);if(p&&p.scrollIntoView)p.scrollIntoView({behavior:'smooth',block:'nearest'})});
 const h=location.hash.slice(1);if(['video','survey','app'].includes(h))show(h)};
function work(user,tasks){
 const by=t=>tasks.filter(x=>x.type===t);
 $('#cSurvey').textContent=by('survey').length;$('#cApp').textContent=by('app').length;
 $('#wsurvey').innerHTML=by('survey').length?by('survey').map(t=>taskCard(t,user)).join(''):emptyBox('There are currently no surveys available. New surveys are published regularly, so please check back later.');
 $('#wapp').innerHTML=by('app').length?by('app').map(t=>taskCard(t,user)).join(''):emptyBox('There are currently no app testing tasks available. New tasks are published regularly, so please check back later.');
 api('/videos').then(d=>videos(user,d)).catch(x=>{$('#wvideo').innerHTML=emptyBox(esc(x.message))});
 const show=w=>{document.querySelectorAll('#wtabs button').forEach(b=>b.classList.toggle('on',b.dataset.w===w));document.querySelectorAll('.wpane').forEach(p=>p.classList.toggle('on',p.id==='w'+w))};
 document.querySelectorAll('#wtabs button').forEach(b=>b.onclick=()=>{show(b.dataset.w);history.replaceState(null,'','#'+b.dataset.w)});
 const h=location.hash.slice(1);if(['video','survey','app'].includes(h))show(h);
}

const pages={
 home(){
  const sel=$('#demoCountry'),usd=3.4,ke=C.find(c=>c.iso2==='KE');
  const kes=Math.round(CFG.referrerKes),joinK=Math.round(CFG.joinKes);
  document.querySelectorAll('.refkes').forEach(e=>e.textContent=kes);
  document.querySelectorAll('.stripkes').forEach(e=>e.textContent='KSh '+kes);
  document.querySelectorAll('.refplus').forEach(e=>e.textContent='+KSh '+kes);
  $('#pairRefL').textContent='About $'+usdOf(CFG.referrerKes).toFixed(2)+' in US dollars';
  $('#joinKesTxt').textContent='KSh '+joinK;
  $('#chipRef').textContent='+KSh '+kes+' to your balance';
  document.querySelectorAll('.spot').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}));
  sel.innerHTML=C.map(c=>`<option value="${c.iso2}">${esc(c.country)}</option>`).join('');sel.value='KE';
  const show=()=>{const l=local(usd,C.find(c=>c.iso2===sel.value));$('#demoLocal').textContent=l||'Paid in US dollars'};
  sel.onchange=show;show();countUp($('#demoAmt'));
  const opts=C.map(c=>`<option value="${c.iso2}">${esc(c.country)}</option>`).join(''),cc=$('#calcCountry'),n=$('#calcN'),per=usdOf(CFG.referrerKes);
  cc.innerHTML=opts;cc.value='KE';
  const calc=()=>{const f=+n.value,t=f*per;$('#calcNum').textContent=f;$('#calcKes').textContent='KSh '+Math.round(f*CFG.referrerKes).toLocaleString();$('#calcUsd').textContent='About $'+t.toFixed(2);
   $('#calcLocal').textContent=cc.value==='KE'?'Paid out in Kenya shillings':(local(t,C.find(c=>c.iso2===cc.value))||'Paid in US dollars');
   document.querySelectorAll('#presets button').forEach(b=>b.classList.toggle('on',+b.dataset.n===f))};
  n.oninput=calc;cc.onchange=calc;
  document.querySelectorAll('#presets button').forEach(b=>b.onclick=()=>{n.value=b.dataset.n;calc()});calc();
  $('#rates').innerHTML=['KE','NG','GH','UG','TZ','IN','ZA','PH'].map(k=>C.find(c=>c.iso2===k)).filter(Boolean).map(c=>`<div class="rate"><small>${ICON.coins}${esc(c.country)}</small><b>${esc(c.symbol)} ${c.rate_per_usd.toLocaleString(undefined,{maximumFractionDigits:2})}</b><span>for $1, in ${esc(c.currency_code)}</span></div>`).join('');
 },
 signup(){
  $('#country').innerHTML='<option value="">Select your country</option>'+C.map(c=>`<option value="${c.iso2}">${esc(c.country)}</option>`).join('');
  $('#ref').value=new URLSearchParams(location.search).get('ref')||'';
  const u=$('#username'),p=$('#password'),c=$('#confirmPassword'),m=$('#match');
  u.oninput=()=>u.value=u.value.toLowerCase().replace(/[^a-z0-9_]/g,'');
  const check=()=>{
   let n=0;document.querySelectorAll('#rules li').forEach(li=>{const ok=PW[li.dataset.r](p.value);li.classList.toggle('ok',ok);if(ok)n++});
   $('#meter').dataset.n=p.value?n:0;
   $('#mlabel').textContent=!p.value?'':n<=2?'Weak password':n<5?'Almost there':'Strong password';
   if(!c.value){m.className='match hide';m.textContent=''}
   else{const same=c.value===p.value;m.className='match '+(same?'ok':'no');m.textContent=same?'Passwords match':'Passwords do not match'}
  };
  p.oninput=c.oninput=check;check();
  submit('#f',async d=>{
   if(d.username.length<3)throw new Error('Username must be at least 3 characters');
   if(!pwOk(d.password))throw new Error('Your password needs to meet every rule in the list');
   if(d.password!==d.confirmPassword)throw new Error('Passwords do not match');
   localStorage.t=(await api('/signup',d)).token;location='/dashboard.html'});
 },
 login(){submit('#f',async d=>{localStorage.t=(await api('/login',d)).token;const n=new URLSearchParams(location.search).get('next');location=n&&/^\/[\w\-.\/]*(#[\w\/\-]*)?$/.test(n)&&!n.startsWith('//')?n:'/dashboard.html'})},
 async dashboard(){
  wireTiles();
  const fail=e=>{$('#dashErr').hidden=false;$('#dashErrMsg').textContent=(e&&e.message)||'Something went wrong.';['#wvideo','#wsurvey','#wapp'].forEach(q=>$(q).innerHTML=emptyBox('Tasks could not be loaded. See the message at the top of the page.'))};
  $('#retry').onclick=()=>location.reload();
  let me;try{me=await api('/me')}catch(e){fail(e);return}
  const{user,payoutDate,referrals}=me;
  $('#hello').textContent=user.username?`Hi, ${user.username}`:'Welcome back';
  $('#bal').innerHTML=money(user.balanceKes,user.country);countUp($('#bal .money b'));
  $('#pay').textContent=payoutDate?new Date(payoutDate).toDateString():'Not announced yet';
  const wd=$('#wdModal'),wdClose=()=>{wd.hidden=true;document.body.style.overflow=''};
  $('#wdBtn').onclick=()=>{$('#wdWhen').textContent=payoutDate?' ('+new Date(payoutDate).toDateString()+')':'';wd.hidden=false;document.body.style.overflow='hidden';$('#wdOk').focus()};
  $('#wdOk').onclick=wdClose;wd.onclick=e=>{if(e.target===wd)wdClose()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!wd.hidden)wdClose()});
  const link=location.origin+'/signup.html?ref='+user.refCode;$('#ref').value=link;
  const co=C.find(x=>x.iso2===String(user.country||'').toUpperCase());
  if(co){$('#hFlag').textContent=[...co.iso2.toUpperCase()].map(ch=>String.fromCodePoint(127397+ch.charCodeAt(0))).join('');$('#hName').textContent=co.country;$('#hPill').hidden=false}
  const G=[5,10,25,50],g=G.find(x=>x>referrals)||G[G.length-1],plain=h=>h.replace(/<small>.*?<\/small>/,'').replace(/<[^>]+>/g,'');
  $('#goalTxt').textContent=referrals>=G[G.length-1]?`Top goal reached: ${referrals} friends`:`Next goal: ${referrals} of ${g} friends`;
  $('#goalAmt').textContent='Earn '+plain(money(g*CFG.referrerKes,user.country));$('#goalBar').style.width=Math.min(100,referrals/g*100)+'%';
  $('#bonus').innerHTML=money(CFG.referrerKes,user.country);
  const msg=encodeURIComponent('Join me on MawiE and get paid to rate videos and surveys: '+link);$('#shWa').href='https://wa.me/?text='+msg;$('#shTg').href='https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent('Join me on MawiE and get paid to rate videos and surveys.');
  const cp=$('#copy');
  cp.onclick=async()=>{try{await navigator.clipboard.writeText(link)}catch{$('#ref').select();try{document.execCommand('copy')}catch{}}cp.innerHTML=ICON.check+'Copied';setTimeout(()=>cp.innerHTML=ICON.copy+'Copy link',1800)};
  let tasks=[];try{tasks=await api('/tasks')}catch(e){fail(e)}
  $('#sTasks').textContent=tasks.length;$('#sRefs').textContent=referrals;$('#sSince').textContent=new Date(user.createdAt).toLocaleDateString(undefined,{month:'short',year:'numeric'});
  work(user,tasks);
  api('/transactions').then(rows=>{
   const L={video:'Watched a video',survey:'Survey answered',app:'App tested',referral:'Friend joined',bonus:'Welcome bonus',adjust:'Adjustment',revoke:'Reward taken back'},I={video:'video',survey:'survey',app:'phone',referral:'users',bonus:'gift',adjust:'wallet',revoke:'ban'};
   $('#acts').innerHTML=rows.length?rows.map(t=>{const neg=t.amountKes<0,m=money(Math.abs(t.amountKes),user.country).replace(/<small>.*?<\/small>/,'');
    return `<li><span class="ai${neg?' out':''}">${ICON[I[t.kind]||'coins']}</span><div class="am"><b>${esc(t.note||L[t.kind]||t.kind)}</b><small>${L[t.kind]||t.kind} · ${new Date(t.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</small></div><span class="amt${neg?' neg':''}">${neg?'-':'+'}${m}</span></li>`}).join('')
    :'<li><div class="am"><b>Nothing yet</b><small>Watch a video or answer a survey and your earnings show up here.</small></div></li>'}).catch(()=>{});
 },
 adminx(){window.adminInit().catch(e=>{document.body.innerHTML='<p style="padding:40px;font:16px system-ui;max-width:560px"><b>The admin panel could not open.</b><br>'+esc(e&&e.message||e)+'<br><br><a href="/mawira.html">Try again</a> &middot; <a href="/dashboard.html">Go to your dashboard</a></p>'})}
 };
window.evalTask=async id=>{try{await api(`/tasks/${id}/evaluate`,{answer:$('#a'+id).value});location.reload()}catch(x){alert(x.message)}};
window.logout=logout;
// admin page: start the first requests now, in parallel, instead of after the country list has loaded
if(document.body.dataset.p==='adminx'){api('/me',undefined,1).catch(()=>{});api('/admin/gate',undefined,1).catch(()=>{});if(sessionStorage.gateT&&!/^#\/(?!overview)/.test(location.hash))api('/admin/overview?range=14',undefined,1).catch(()=>{})}
// Site banner (text is set in the admin panel, Settings). A visitor can close it; it comes back when the message changes.
const showBanner=text=>{const b=$('#announce');if(!b)return;text=String(text||'').trim();
  const key='ann:'+text;let gone=false;try{gone=!!text&&localStorage.getItem('annX')===key}catch{}
  if(!text||gone){b.textContent='';return}
  b.textContent='';b.setAttribute('role','status');
  const ico=document.createElement('span');ico.className='ann-ico';ico.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>';
  const t=document.createElement('span');t.className='ann-t';t.textContent=text;
  const x=document.createElement('button');x.type='button';x.className='ann-x';x.setAttribute('aria-label','Dismiss message');x.textContent='\u00d7';
  x.onclick=()=>{try{localStorage.setItem('annX',key)}catch{}b.remove()};
  b.append(ico,t,x)};
Promise.all([fetch('/countries.json').then(r=>r.json()),fetch('/api/config').then(r=>r.json()).catch(()=>CFG)]).then(([d,c])=>{C=d;CFG={...CFG,...c};showBanner(c.announcement);pages[document.body.dataset.p]?.()}).catch(()=>{});
