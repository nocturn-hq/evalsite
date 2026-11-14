// MawiE support chat. One conversation pane is shared by the floating widget (every page) and the admin inbox (admin.js).
// It polls the server every few seconds (no websockets, so it works on any host). Needs app.js first (uses its api()).
(()=>{
const D=document,E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=p=>`<svg class="mi" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const I={
 send:ic('<path d="M21 3L3 10.5l6.5 2.5L12 20l3-5 6-12z"/>'),x:ic('<path d="M6 6l12 12M18 6L6 18"/>'),
 down:ic('<path d="M6 9l6 6 6-6"/>'),back:ic('<path d="M15 5l-7 7 7 7"/>'),
 expand:ic('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>'),shrink:ic('<path d="M20 10h-6V4M4 14h6v6M14 10l7-7M3 21l7-7"/>'),
 reply:ic('<path d="M9 7L4 12l5 5"/><path d="M4 12h9a7 7 0 0 1 7 7"/>'),
 copy:ic('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
 trash:ic('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'),
 ban:ic('<circle cx="12" cy="12" r="9"/><path d="M5.700 5.700l12.600 12.600"/>'),
 one:ic('<path d="M5 12.500l4.500 4.500L19 7.500"/>'),dbl:ic('<path d="M2 12.500l4.500 4.500L16 7.500M10 16.500l1 .5L21 7.500"/>')};
// reactions are drawn icons, one per person per message
const R={heart:ic('<path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>'),
 like:ic('<path d="M7 11v9H4v-9zM7 11l4-7c1.500 0 2.500 1 2.200 2.600L12.600 9H19a2 2 0 0 1 2 2.400l-1.300 6.400A2 2 0 0 1 17.800 19H7"/>'),
 smile:ic('<circle cx="12" cy="12" r="9"/><path d="M8 14a4.500 4.500 0 0 0 8 0M9 9.500h.01M15 9.500h.01"/>'),
 check:ic('<circle cx="12" cy="12" r="9"/><path d="M8 12.500l3 3 5-6"/>'),
 star:ic('<path d="M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z"/>'),
 bolt:ic('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>')};
const RN={heart:'Love',like:'Like',smile:'Funny',check:'Done',star:'Great',bolt:'Fast'};
const hm=d=>new Date(d).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
const dayLbl=d=>{const x=new Date(d),s=z=>z.toDateString();return s(x)===s(new Date())?'Today':s(x)===s(new Date(Date.now()-864e5))?'Yesterday':x.toLocaleDateString([],{day:'numeric',month:'short',year:'numeric'})};
const coarse=matchMedia('(pointer:coarse)');

// o: {side:'u'|'a', base:'/chat' or '/admin/chats/<id>', other:'name shown on quotes', welcome:'html'|'', chips:[text]}
function pane(o){
  const me=o.side==='u'?'user':'admin';
  const el=D.createElement('div');el.className='mc-pane';
  el.innerHTML=`<div class="mc-msgs" role="log" aria-live="polite"></div><div class="mc-typing" hidden><span></span><span></span><span></span></div>
   <div class="mc-rb" hidden><div class="mc-rt"></div><button type="button" class="mc-x" aria-label="Cancel reply">${I.x}</button></div>
   <p class="mc-err" role="alert" hidden></p>
   <form class="mc-comp"><textarea rows="1" maxlength="1000" placeholder="Type a message" aria-label="Message"></textarea><button class="mc-send" type="submit" aria-label="Send message">${I.send}</button></form>
   <div class="mc-menu" hidden></div>`;
  const q=s=>el.querySelector(s),box=q('.mc-msgs'),ta=q('textarea'),typ=q('.mc-typing'),menu=q('.mc-menu'),rb=q('.mc-rb'),er=q('.mc-err');
  let msgs=[],sig='',timer=0,busy=0,replyTo=null,tmp=0,lastTyp=0,pressT=0;
  const err=t=>{er.textContent=t||'';er.hidden=!t;if(t)setTimeout(()=>{er.hidden=true},5000)};
  const get=()=>api(o.base+(o.side==='a'?'?fresh=1':''),undefined,1);
  const bub=m=>{const mine=m.from===me,rx=['u','a'].map(s=>m.re&&m.re[s]).filter(Boolean);
    return `<div class="mc-m ${mine?'out':'in'}${m.del?' del':''}${m.pending?' pend':''}" data-id="${m.id}"><div class="mc-b">
     ${m.reply?`<button type="button" class="mc-q" data-q="${m.reply.id}"><b>${m.reply.from===me?'You':E(o.other)}</b>${E(m.reply.text)}</button>`:''}
     ${m.del?`<i class="mc-d">${I.ban}This message was deleted</i>`:`<span class="mc-t">${E(m.text)}</span>`}
     <span class="mc-meta">${hm(m.at)}${mine&&!m.del?`<span class="mc-tk${m.read?' rd':''}" title="${m.read?'Read':'Sent'}">${m.read?I.dbl:I.one}</span>`:''}</span>
     ${m.del||m.pending?'':`<button type="button" class="mc-more" aria-label="Message options">${I.down}</button>`}</div>
     ${rx.length?`<div class="mc-rx">${rx.map(k=>`<span class="r-${k}" title="${RN[k]}">${R[k]}</span>`).join('')}</div>`:''}</div>`};
  const render=force=>{
    const s=JSON.stringify([msgs.map(m=>[m.id,m.re,m.read,m.del,m.pending]),!typ.hidden]);if(s===sig&&!force)return;sig=s;
    const near=box.scrollHeight-box.scrollTop-box.clientHeight<90||force;let h=o.welcome?`<div class="mc-m in wel"><div class="mc-b"><b class="mc-who">MawiE Support</b><span class="mc-t">${o.welcome}</span></div></div>`:'',day='';
    for(const m of msgs){const d=dayLbl(m.at);if(d!==day){day=d;h+=`<div class="mc-day"><span>${d}</span></div>`}h+=bub(m)}
    if(o.chips&&o.chips.length&&!msgs.some(m=>m.from===me))h+=`<div class="mc-chips">${o.chips.map((c,i)=>`<button type="button" data-c="${i}">${E(c)}</button>`).join('')}</div>`;
    if(!msgs.length&&!o.welcome)h+=`<div class="mc-none">No messages yet. Say hello.</div>`;
    box.innerHTML=h;if(near)box.scrollTop=box.scrollHeight};
  const markRead=()=>{if(D.hidden||!msgs.some(m=>m.from!==me&&!m.read&&!m.del))return;
    msgs.forEach(m=>{if(m.from!==me)m.read=true});api(o.base+'/read',{},1).then(()=>o.onRead&&o.onRead()).catch(()=>{})};
  const load=async()=>{if(busy)return;busy=1;try{const d=await get();msgs=d.msgs.concat(msgs.filter(x=>x.pending));typ.hidden=!d.typing;render();markRead()}catch{}finally{busy=0}};
  const setReply=m=>{replyTo=m;rb.hidden=!m;if(m){q('.mc-rt').innerHTML=`<b>${m.from===me?'You':E(o.other)}</b>${E(m.text.slice(0,90))}`;ta.focus()}};
  const send=async text=>{text=String(text).trim();if(!text)return;
    const rp=replyTo,t={id:'t'+(++tmp),from:me,text,at:new Date().toISOString(),pending:1,reply:rp&&{id:rp.id,text:rp.text.slice(0,80),from:rp.from}};
    msgs.push(t);setReply(null);render(true);
    try{await api(o.base,{text,reply:rp&&rp.id},1);msgs=msgs.filter(x=>x!==t);await load();render(true)}
    catch(e){msgs=msgs.filter(x=>x!==t);render();err(e.message);ta.value=text;grow()}};
  const grow=()=>{ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,120)+'px'};
  const closeMenu=()=>{menu.hidden=true};
  const openMenu=(id,anchor)=>{const m=msgs.find(x=>String(x.id)===String(id));if(!m||m.del||m.pending)return;
    const mine=m.from===me,cur=m.re&&m.re[o.side];
    menu.innerHTML=`<div class="mc-rr">${Object.keys(R).map(k=>`<button type="button" data-r="${k}" class="r-${k}${cur===k?' on':''}" aria-label="${RN[k]}" title="${RN[k]}">${R[k]}</button>`).join('')}</div>
     <button type="button" data-a="reply">${I.reply}Reply</button><button type="button" data-a="copy">${I.copy}Copy</button>${mine||o.side==='a'?`<button type="button" data-a="del" class="bad">${I.trash}Delete</button>`:''}`;
    menu.dataset.id=id;menu.hidden=false;
    const pr=el.getBoundingClientRect(),ar=anchor.getBoundingClientRect(),mw=menu.offsetWidth,mh=menu.offsetHeight;
    let top=ar.bottom-pr.top+4;if(top+mh>pr.height-8)top=Math.max(8,ar.top-pr.top-mh-4);
    const left=Math.max(8,Math.min(mine?ar.right-pr.left-mw:ar.left-pr.left,pr.width-mw-8));menu.style.cssText=`top:${top}px;left:${left}px`};
  const react=async(id,k)=>{const m=msgs.find(x=>String(x.id)===String(id));if(!m)return;
    m.re={...m.re};if(m.re[o.side]===k)delete m.re[o.side];else m.re[o.side]=k;render();
    try{await api(o.base+'/react',{id,r:k},1)}catch(e){err(e.message)}load()};
  menu.onclick=async e=>{const b=e.target.closest('button');if(!b)return;const id=menu.dataset.id,m=msgs.find(x=>String(x.id)===String(id));closeMenu();if(!m)return;
    if(b.dataset.r)return react(id,b.dataset.r);
    if(b.dataset.a==='reply')setReply(m);
    if(b.dataset.a==='copy')try{await navigator.clipboard.writeText(m.text)}catch{}
    if(b.dataset.a==='del'){m.del=true;m.text='';render();try{await api(o.base+'/delete',{id},1)}catch(x){err(x.message)}load()}};
  box.addEventListener('click',e=>{closeMenu();
    const more=e.target.closest('.mc-more');if(more)return openMenu(more.closest('.mc-m').dataset.id,more);
    const c=e.target.closest('[data-c]');if(c)return send(o.chips[+c.dataset.c]);
    const qt=e.target.closest('.mc-q');if(qt){const t=box.querySelector(`[data-id="${qt.dataset.q}"] .mc-b`);if(t){t.scrollIntoView({block:'center',behavior:'smooth'});t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash')}}});
  box.addEventListener('dblclick',e=>{const b=e.target.closest('.mc-m:not(.wel):not(.del):not(.pend) .mc-b');if(b&&!e.target.closest('button'))react(b.parentNode.dataset.id,'heart')});
  box.addEventListener('contextmenu',e=>{const b=e.target.closest('.mc-m:not(.wel) .mc-b');if(b){e.preventDefault();openMenu(b.parentNode.dataset.id,b)}});
  // press and hold on a phone opens the same menu
  box.addEventListener('pointerdown',e=>{const b=e.pointerType==='touch'&&e.target.closest('.mc-m:not(.wel) .mc-b');if(b)pressT=setTimeout(()=>openMenu(b.parentNode.dataset.id,b),450)});
  ['pointerup','pointermove','pointercancel','scroll'].forEach(v=>box.addEventListener(v,()=>clearTimeout(pressT),{passive:true}));
  D.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();e.stopPropagation()}},true);
  D.addEventListener('click',e=>{if(!menu.hidden&&!e.target.closest('.mc-menu,.mc-more'))closeMenu()});
  q('.mc-x').onclick=()=>setReply(null);
  ta.addEventListener('input',()=>{grow();const n=Date.now();if(ta.value&&n-lastTyp>2500){lastTyp=n;api(o.base+'/typing',{},1).catch(()=>{})}});
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!coarse.matches){e.preventDefault();q('form').requestSubmit()}});
  q('form').onsubmit=e=>{e.preventDefault();const t=ta.value;ta.value='';grow();send(t)};
  return{el,focus:()=>ta.focus(),reload:load,
    start(){this.stop();load();timer=setInterval(()=>{if(!D.hidden)load()},o.every||2500)},
    stop(){clearInterval(timer);closeMenu()}};
}
window.MC={pane,I,R,E,hm};

// ---------- floating button for visitors and users (not the admin panel) ----------
if(D.body.dataset.p==='adminx')return;
const P=D.body.dataset.p,tok=(()=>{try{return localStorage.t}catch{return''}})();
const root=D.createElement('div');root.className='mc-root mc-widget';
root.innerHTML=`<button class="mc-fab" type="button" aria-label="Chat with support" aria-expanded="false" aria-controls="mcwin"><span class="mc-ico"></span><b class="mc-badge" hidden></b></button>
 <section class="mc-win" id="mcwin" role="dialog" aria-label="Support chat" hidden>
  <header class="mc-h"><span class="mc-av"><img src="/img/logo.png" alt=""></span><div class="mc-hn"><b>MawiE Support</b><small>Ask us about your account or payouts</small></div>
   <button type="button" class="mc-hb" data-a="size" aria-label="Expand chat">${I.expand}</button><button type="button" class="mc-hb" data-a="close" aria-label="Close chat">${I.x}</button></header>
  <div class="mc-body"></div></section>`;
D.body.appendChild(root);
const fab=root.querySelector('.mc-fab'),win=root.querySelector('.mc-win'),body=root.querySelector('.mc-body'),badge=root.querySelector('.mc-badge'),sz=root.querySelector('[data-a=size]');
let pn=null,open=false,poll=0;
const setBadge=n=>{badge.hidden=!n;badge.textContent=n>9?'9+':n};
const full=on=>{win.classList.toggle('full',on);D.documentElement.classList.toggle('mc-lock',on);sz.innerHTML=on?I.shrink:I.expand;sz.setAttribute('aria-label',on?'Shrink chat':'Expand chat')};
const build=async()=>{
  if(!tok){const here=P==='login'?'<a class="mc-btn" href="/signup.html">Create account</a>':P==='signup'?'<a class="mc-btn pri" href="/login.html">Log in</a>':'<a class="mc-btn pri" href="/login.html?next=/dashboard.html">Log in</a><a class="mc-btn" href="/signup.html">Create account</a>';
    body.innerHTML=`<div class="mc-out"><div class="mc-m in wel"><div class="mc-b"><b class="mc-who">MawiE Support</b><span class="mc-t">Welcome. Log in to message our team. Your conversation is saved, so you can come back to it any time.</span></div></div><div class="mc-acts">${here}</div></div>`;return}
  let name='';try{name=(await api('/me',undefined,1)).user.username||''}catch{}
  pn=pane({side:'u',base:'/chat',other:'Support',every:2500,onRead:()=>setBadge(0),
    welcome:`Hi${name?' '+E(name):''}, welcome to MawiE support. Tell us what you need help with and our team will reply right here. You can close this and come back, your chat is saved.`,
    chips:['My payout','A video did not pay','Account help','Referral bonus']});
  body.appendChild(pn.el)};
const show=async on=>{open=on;win.hidden=!on;fab.setAttribute('aria-expanded',on);fab.classList.toggle('on',on);
  if(on){if(!body.firstChild)await build();if(pn){pn.start();pn.focus()}setBadge(0)}else{if(pn)pn.stop();full(false);fab.focus()}};
fab.onclick=()=>show(!open);
win.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;if(b.dataset.a==='close')show(false);if(b.dataset.a==='size')full(!win.classList.contains('full'))});
D.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){if(win.classList.contains('full'))full(false);else show(false)}});
// while the window is closed, check for new replies now and then so the button can show a number
if(tok){const check=async()=>{if(open||D.hidden)return;try{setBadge((await api('/chat/unread',undefined,1)).n)}catch{}};setTimeout(check,1500);poll=setInterval(check,20000)}
})();
