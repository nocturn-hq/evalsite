require('dotenv').config();
const crypto=require('crypto');
const express=require('express'),mongoose=require('mongoose'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken');
const fs=require('fs'),path=require('path');
const models=require('./models');
const {User,Task,Evaluation,WatchSession,Setting,LoginLog,Transaction,AuditLog,ChatMsg}=models;
const app=express();let compression=null;try{compression=require('compression')}catch{} // optional: run npm install to switch on gzip
const PUB=path.join(__dirname,'public');
app.disable('x-powered-by');
// Behind a hosting proxy (Render, Railway, Fly, Heroku) the visitor's real address is in X-Forwarded-For. It is only trusted when the host
// really is a proxy, otherwise anyone could fake an address and dodge the rate limits. Force it with TRUST_PROXY=1 (or 0 to switch it off).
{const t=process.env.TRUST_PROXY;app.set('trust proxy',t!==undefined?(/^\d+$/.test(t)?+t:t==='true'?1:false):(process.env.RENDER||process.env.RAILWAY_ENVIRONMENT||process.env.FLY_APP_NAME||process.env.DYNO?1:false))}
// Browser security headers. Scripts and styles may be inline (the pages use a few), but nothing can be loaded from other sites except the YouTube player.
const CSP="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://i.ytimg.com; font-src 'self'; frame-src https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
app.use((q,r,n)=>{r.set({'Content-Security-Policy':CSP,'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()'});if(q.secure)r.set('Strict-Transport-Security','max-age=15552000');n()});
if(compression)app.use(compression());
// small bodies only (the wallpaper upload has its own bigger limit below). Answers and notes are capped far below this anyway.
const jsonSmall=express.json({limit:'64kb'}),jsonBig=express.json({limit:'800kb'});
app.use((q,r,n)=>q.path==='/api/admin/wallpaper'?n():jsonSmall(q,r,n));
app.use('/api',(q,r,n)=>{r.set('Cache-Control','no-store');n()});
// Pages are sent with ?v=<hash> on every stylesheet and script. The hash changes whenever a file changes, so the files can be cached for a year
// (instant repeat visits) and an update still shows up straight away.
const assetV=(()=>{let t=0,v='';return()=>{const now=Date.now();if(now-t<3000&&v)return v;t=now;
  try{let x='';for(const d of['css','js'])for(const f of fs.readdirSync(path.join(PUB,d))){const st=fs.statSync(path.join(PUB,d,f));x+=f+st.size+':'+st.mtimeMs+';'}v=crypto.createHash('md5').update(x).digest('hex').slice(0,8)}catch{v=String(now)}return v}})();
const pageCache=new Map();
app.get(/^\/(?:([\w-]+)\.html)?$/,(q,r,next)=>{
  const f=path.join(PUB,(q.params[0]||'index')+'.html');let st;try{st=fs.statSync(f)}catch{return next()}
  const v=assetV();let c=pageCache.get(f);
  if(!c||c.m!==st.mtimeMs||c.v!==v){c={m:st.mtimeMs,v,html:fs.readFileSync(f,'utf8').replace(/((?:href|src)="\/(?:css|js)\/[\w.-]+)"/g,'$1?v='+v+'"')};pageCache.set(f,c)}
  r.set('Cache-Control','no-cache').type('html').send(c.html)});
app.use(express.static(PUB,{index:false,setHeaders:(res,p)=>{
  if(/\.woff2?$/i.test(p))res.setHeader('Cache-Control','public, max-age=31536000, immutable');
  else if(/\.(css|js)$/i.test(p))res.setHeader('Cache-Control',res.req.query&&res.req.query.v?'public, max-age=31536000, immutable':'no-cache');
  else if(/\.(png|jpe?g|webp|svg|ico)$/i.test(p))res.setHeader('Cache-Control','public, max-age=604800');
  else if(/countries\.json$/i.test(p))res.setHeader('Cache-Control','public, max-age=3600, stale-while-revalidate=86400')}}));
app.use((q,r,n)=>{const t0=Date.now();r.on('finish',()=>{const ms=Date.now()-t0;if(ms>800&&q.originalUrl.startsWith('/api'))console.log('Slow request:',q.method,q.originalUrl,ms+'ms')});if(q.method==='POST'&&/^\/api\/admin\/users/.test(q.originalUrl))authCache.clear();n()});

const JWT_OPTS={algorithms:['HS256']};
const sign=u=>jwt.sign({id:u._id,admin:u.isAdmin},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:'30d'});
const authCache=new Map(); // user id -> {u,exp}; short cache so every request does not wait on the database
setInterval(()=>{const now=Date.now();for(const[k,c]of authCache)if(c.exp<now)authCache.delete(k)},60000).unref();
const auth=async(q,r,n)=>{try{const h=q.headers.authorization||'';if(!h.startsWith('Bearer '))throw 0;const t=jwt.verify(h.slice(7),process.env.JWT_SECRET,JWT_OPTS);
  let c=authCache.get(t.id);if(!c||c.exp<Date.now()){const u0=await User.findById(t.id).select('banned isAdmin username email pwAt').lean();c=u0&&{u:u0,exp:Date.now()+15000};if(c)authCache.set(t.id,c)}
  const u=c&&c.u;if(!u)throw 0;
  if(u.pwAt&&t.iat<Math.floor(+u.pwAt/1000))throw 0; // the password was reset after this login was made: log in again
  if(u.banned)return r.status(403).json({error:'This account has been banned'});
  q.user={id:t.id,admin:u.isAdmin,name:u.username||u.email};n()}catch{r.status(401).json({error:'Please log in'})}};
const logLogin=async u=>{const day=new Date().toISOString().slice(0,10);
  const res=await LoginLog.updateOne({user:u._id,day},{$inc:{count:1}},{upsert:true});
  // loginDays is a counter on the user, so the old LoginLog rows can expire without losing the number
  await User.updateOne({_id:u._id},res.upsertedCount?{$set:{lastLoginAt:new Date()},$inc:{loginDays:1}}:{$set:{lastLoginAt:new Date()}})};
const adminBase=(q,r,n)=>q.user.admin?n():r.status(403).json({error:'Admins only'});
// Secret admin password: every admin route also needs a fresh unlock token (header x-gate).
const GATE_SECRET=()=>String(process.env.JWT_SECRET)+':admin-gate';
const gateOpen=(q)=>{try{const t=jwt.verify(q.headers['x-gate']||'',GATE_SECRET(),JWT_OPTS);return t.gate===true&&String(t.id)===String(q.user.id)}catch{return false}};
let gateExists=false; // once an admin password exists it stays until the server restarts with RESET_ADMIN_PASSWORD
const admin=async(q,r,n)=>{
  if(!q.user.admin)return r.status(403).json({error:'Admins only'});
  try{
    if(!gateExists&&!(gateExists=!!await Setting.findOne({key:'adminGateHash'})))return r.status(403).json({error:'Create your admin password first',gate:'setup'});
    if(!gateOpen(q))return r.status(403).json({error:'Enter your admin password',gate:'locked'});
    n();
  }catch(e){r.status(500).json({error:'Could not check the admin password'})}};
// Gmail only. Dots and +tags are the same inbox, so strip them.
const gmail=e=>{e=String(e||'').trim().toLowerCase();const[l,d]=e.split('@');return d==='gmail.com'&&l?l.split('+')[0].replace(/\./g,'')+'@gmail.com':null};
// Strong password: 8+ characters with a lowercase letter, an uppercase letter, a number and a symbol.
const pwProblem=p=>{p=String(p||'');
  if(p.length<8)return 'Password must be at least 8 characters';
  if(p.length>72)return 'Password must be 72 characters or fewer';
  if(!/[a-z]/.test(p))return 'Password needs a lowercase letter';
  if(!/[A-Z]/.test(p))return 'Password needs an uppercase letter';
  if(!/\d/.test(p))return 'Password needs a number';
  if(!/[^A-Za-z0-9]/.test(p))return 'Password needs a symbol such as ! @ # $';
  return null};
const uname=u=>{u=String(u||'').trim().toLowerCase();return /^[a-z0-9_]{3,20}$/.test(u)?u:null};
// Visitors never see database internals; the messages we throw ourselves (new Error('...')) are shown as written.
const safeMsg=e=>{if(!e)return 'Something went wrong';if(e.code===11000)return 'That already exists';if(e.name==='CastError'||e.name==='ValidationError'||/^Mongo/.test(e.name||''))return 'That request was not valid';return e.message||'Something went wrong'};
const wrap=f=>(q,r)=>Promise.resolve().then(()=>f(q,r)).catch(e=>{console.error('Request error on',q.method,q.originalUrl,'-',e&&e.stack||e);if(!r.headersSent)r.status(400).json({error:safeMsg(e)})});
const reEsc=s=>String(s).trim().slice(0,60).replace(/[.*+?^${}()|\[\]\\]/g,'\\$&');
const rxOf=s=>new RegExp(reEsc(s),'i');
// usernames and Gmail addresses are stored in lowercase, so searching them needs no case-insensitive flag. That is much faster in MongoDB.
const rxLow=s=>new RegExp(reEsc(String(s).toLowerCase()));
const isId=s=>typeof s==='string'&&/^[a-f0-9]{24}$/i.test(s);
app.param('id',(q,r,n,v)=>isId(v)?n():r.status(400).json({error:'That request was not valid'}));
const idMap=a=>Object.fromEntries(a.map(x=>[String(x._id),x]));
// ---------- rate limits (in memory, per visitor address) and a small cache for slow answers ----------
const hits=new Map();
const rate=(name,max,ms,keyOf)=>(q,r,n)=>{const k=name+':'+(keyOf?keyOf(q):q.ip),now=Date.now();let h=hits.get(k);
  if(!h||h.t<now){h={n:0,t:now+ms};hits.set(k,h)}
  if(++h.n>max){r.set('Retry-After',Math.ceil((h.t-now)/1000));return r.status(429).json({error:'Too many attempts. Please wait a few minutes and try again.'})}n()};
const loginFails=new Map(); // address|login -> {n,until,seen}; 8 wrong passwords in a row lock that pair for 15 minutes
const loginLocked=k=>{const f=loginFails.get(k);return!!f&&f.until>Date.now()};
const loginFail=k=>{const f=loginFails.get(k)||{n:0,until:0};f.seen=Date.now();if(f.until&&f.until<Date.now()){f.n=0;f.until=0}if(++f.n>=8){f.until=Date.now()+15*60000;f.n=0}loginFails.set(k,f)};
setInterval(()=>{const now=Date.now();for(const[k,h]of hits)if(h.t<now)hits.delete(k);for(const[k,f]of loginFails)if(f.until<now&&now-f.seen>3600000)loginFails.delete(k);for(const[k,h]of memo)if(h.exp<now)memo.delete(k)},60000).unref();
const memo=new Map(); // key -> {exp,p}. Results of slow whole-collection queries, kept for a short time.
const cached=(key,ms,fn)=>{const h=memo.get(key),now=Date.now();if(h&&h.exp>now)return h.p;const p=Promise.resolve().then(fn);memo.set(key,{exp:now+ms,p});p.catch(()=>memo.delete(key));return p};
app.use('/api',rate('api',600,60000));

// ---------- settings (editable from the admin panel) ----------
let cfgCache=null; // settings are read on almost every request, so they are kept for 10 seconds (and dropped the moment one is saved)
const setSetting=async(key,value)=>{const r=await Setting.updateOne({key},{value:String(value)},{upsert:true});cfgCache=null;return r};
const getCfg=async()=>{
  if(cfgCache&&cfgCache.exp>Date.now())return cfgCache.v;
  const m=Object.fromEntries((await Setting.find({key:{$in:['referrerKes','joinKes','signupsOpen','payoutDate','announcement']}}).lean()).map(x=>[x.key,x.value]));
  const num=(k,d)=>m[k]!==undefined&&Number.isFinite(+m[k])?+m[k]:d;
  const v={referrerKes:num('referrerKes',80),joinKes:num('joinKes',20),signupsOpen:m.signupsOpen!=='0',payoutDate:m.payoutDate||'',announcement:m.announcement||''};
  cfgCache={exp:Date.now()+10000,v};return v;
};
// ---------- ledger + audit trail ----------
const tx=(user,kind,amountKes,note,task,by)=>Transaction.create({user,kind,amountKes,note:note||undefined,task,by}).catch(e=>console.error('LEDGER WRITE FAILED (balance changed, ledger row missing):',kind,amountKes,String(user),e&&e.message));
const audit=(q,action,target,detail)=>AuditLog.create({admin:q.user.id,adminName:q.user.name,action,target:target||undefined,detail:detail||undefined}).catch(e=>console.error('Audit write failed:',e&&e.message));

// public settings, with the banner included so the pages need one request, not two
app.get('/api/config',wrap(async(q,r)=>{const c=await getCfg();r.set('Cache-Control','public, max-age=30');r.json({referrerKes:c.referrerKes,joinKes:c.joinKes,signupsOpen:c.signupsOpen,announcement:c.announcement})}));

let ISO=null;try{ISO=new Set(JSON.parse(fs.readFileSync(path.join(PUB,'countries.json'),'utf8')).map(c=>c.iso2))}catch{}
const REF_CH='abcdefghjkmnpqrstuvwxyz23456789',newRef=()=>Array.from({length:6},()=>REF_CH[crypto.randomInt(REF_CH.length)]).join('');
const DUMMY_HASH=bcrypt.hashSync('not-a-real-password',10); // compared when the account does not exist, so "no such user" takes as long as "wrong password"

app.post('/api/signup',rate('signup',10,3600000),wrap(async(q,r)=>{
  const cfg=await getCfg();if(!cfg.signupsOpen)throw new Error('Sign-ups are paused right now. Please check back soon.');
  const b=q.body||{},password=String(b.password??''),confirmPassword=String(b.confirmPassword??''),country=String(b.country||'').trim().toUpperCase().slice(0,3),
    ref=String(b.ref||'').trim().toLowerCase().slice(0,12),email=gmail(b.email),username=uname(b.username);
  if(!username)throw new Error('Username must be 3 to 20 characters: letters, numbers or underscores');
  if(!email)throw new Error('Use a Gmail address (name@gmail.com)');
  if(!country||(ISO&&!ISO.has(country)))throw new Error('Choose your country');
  const bad=pwProblem(password);if(bad)throw new Error(bad);
  if(password!==confirmPassword)throw new Error('Passwords do not match');
  const clash=await User.findOne({$or:[{username},{email}]}).select('username').lean();
  if(clash)throw new Error(clash.username===username?'That username is taken':'This email is already registered');
  // the invite code must be plain text (an object here would be a database query) and the inviter must not be banned
  const referrer=/^[a-z0-9]{4,12}$/.test(ref)?await User.findOne({refCode:ref,banned:{$ne:true}}).select('_id').lean():null;
  const pass=await bcrypt.hash(password,10);let u;
  for(let i=0;i<5&&!u;i++){
    try{u=await User.create({email,username,country,pass,refCode:newRef(),referredBy:referrer?._id,balanceKes:referrer?cfg.joinKes:0,isAdmin:email===gmail(process.env.ADMIN_EMAIL)})}
    catch(e){if(e&&e.code===11000){const k=Object.keys(e.keyPattern||{})[0];if(k==='username')throw new Error('That username is taken');if(k==='email')throw new Error('This email is already registered');continue}throw e}}
  if(!u)throw new Error('Could not create the account. Please try again.');
  if(referrer){
    await User.updateOne({_id:referrer._id},{$inc:{balanceKes:cfg.referrerKes}}); // atomic
    await Promise.all([tx(u._id,'bonus',cfg.joinKes,'Welcome bonus for joining with an invite'),tx(referrer._id,'referral',cfg.referrerKes,'Friend joined: '+username)]);
  }
  // TODO: email a 6-digit code and set verified=true; decide when referral bonuses are credited
  await logLogin(u);r.json({token:sign(u)});
}));

app.post('/api/login',rate('login',20,15*60000),wrap(async(q,r)=>{
  // "login" can be a username or a Gmail address ("email" still works for older clients)
  const b=q.body||{},id=String(b.login||b.email||'').trim().toLowerCase().slice(0,80),password=String(b.password??'').slice(0,100),lk=q.ip+'|'+id;
  if(loginLocked(lk))throw new Error('Too many wrong attempts. Try again in 15 minutes.');
  const find=id.includes('@')?(gmail(id)?{email:gmail(id)}:null):(id?{username:id}:null);
  const u=find?await User.findOne(find):null;
  const ok=await bcrypt.compare(password,u&&u.pass||DUMMY_HASH);
  if(!u||!ok){loginFail(lk);throw new Error('Wrong username, email or password')}
  loginFails.delete(lk);
  if(u.banned)throw new Error('This account has been banned'+(u.banReason?': '+u.banReason:''));
  // the ADMIN_EMAIL account is always an admin, even if it was created before ADMIN_EMAIL was set
  const owner=gmail(process.env.ADMIN_EMAIL);if(owner&&!u.isAdmin&&gmail(u.email)===owner){u.isAdmin=true;await User.updateOne({_id:u._id},{isAdmin:true})}
  await logLogin(u);r.json({token:sign(u)});
}));

app.get('/api/me',auth,wrap(async(q,r)=>{
  const[u,cfg,referrals]=await Promise.all([User.findById(q.user.id).select('-pass -adminNote -pwAt -verified').lean(),getCfg(),User.countDocuments({referredBy:q.user.id})]);
  if(!u)throw new Error('Account not found');
  r.json({user:u,payoutDate:cfg.payoutDate||null,referrals});
}));
// the signed-in user's own money history
app.get('/api/transactions',auth,wrap(async(q,r)=>r.json(await Transaction.find({user:q.user.id}).sort('-createdAt').limit(30).select('kind amountKes note createdAt').lean())));

// ---------- tasks: surveys, app testing, videos ----------
const doneIds=uid=>Evaluation.distinct('task',{user:uid});
const live={active:{$ne:false}};
const ORDER='pos createdAt _id';
const ytId=u=>{u=String(u||'').trim();let m=u.match(/^[\w-]{11}$/);if(m)return m[0];
  m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/))([\w-]{11})/i);return m?m[1]:null};
const ytTitle=async id=>{try{const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+id),{signal:AbortSignal.timeout(4000)});
  return (await r.json()).title||'YouTube video'}catch{return 'YouTube video'}};
const httpUrl=u=>/^https?:\/\//i.test(String(u||''));

// everything this user still has to do (all types)
app.get('/api/tasks',auth,wrap(async(q,r)=>{
  r.json(await Task.find({_id:{$nin:await doneIds(q.user.id)},...live}).sort(ORDER).select('title type url rewardKes description').lean());
}));

// survey / app testing: the user writes feedback. Videos are paid only through the watch endpoints below.
app.post('/api/tasks/:id/evaluate',auth,wrap(async(q,r)=>{
  const t=await Task.findById(q.params.id).lean();if(!t||t.active===false)throw new Error('Task not found');
  if(t.type==='video')throw new Error('Watch the video to earn this reward');
  const answer=String((q.body||{}).answer||'').trim();if(answer.length<5)throw new Error('Please write a short answer first');
  const res=await Evaluation.updateOne({user:q.user.id,task:t._id},{$setOnInsert:{answer:answer.slice(0,2000)}},{upsert:true});
  if(!res.upsertedCount)throw new Error('Already evaluated');
  await User.updateOne({_id:q.user.id},{$inc:{balanceKes:t.rewardKes||0}});
  await tx(q.user.id,t.type,t.rewardKes||0,t.title,t._id);
  r.json({ok:true});
}));

// the video queue, in the order they were posted, with what this user has already finished
app.get('/api/videos',auth,wrap(async(q,r)=>{
  const[doneList,vids]=await Promise.all([doneIds(q.user.id),Task.find({type:'video',...live}).sort(ORDER).select('title description rewardKes videoId').lean()]);
  const done=new Set(doneList.map(String));
  const items=vids.map(v=>({_id:v._id,title:v.title,description:v.description,rewardKes:v.rewardKes,videoId:v.videoId,done:done.has(String(v._id))}));
  r.json({total:items.length,done:items.filter(i=>i.done).length,items});
}));
// pressed play: remember when, so "finished" can be checked against real time
app.post('/api/videos/:id/start',auth,wrap(async(q,r)=>{
  const t=await Task.findOne({_id:q.params.id,type:'video',...live}).select('_id').lean();if(!t)throw new Error('Video not found');
  if(await Evaluation.exists({user:q.user.id,task:t._id}))throw new Error('Already watched');
  const d=Math.min(3600,Math.max(0,Math.round(+(q.body||{}).duration||0)));
  // one video at a time: starting a new one cancels any other running timer, so nobody can start fifty videos at once and collect them together
  await Promise.all([WatchSession.deleteMany({user:q.user.id,task:{$ne:t._id}}),WatchSession.updateOne({user:q.user.id,task:t._id},{startedAt:new Date(),clientDuration:d},{upsert:true})]);
  r.json({ok:true});
}));
// the video ended: pay the reward you set, once
app.post('/api/videos/:id/complete',auth,wrap(async(q,r)=>{
  const t=await Task.findOne({_id:q.params.id,type:'video',...live}).lean();if(!t)throw new Error('Video not found');
  const s=await WatchSession.findOne({user:q.user.id,task:t._id}).lean();if(!s)throw new Error('Press play to start the video');
  const need=Math.max(10,Math.round((t.durationSec||s.clientDuration||30)*0.85));
  if((Date.now()-s.startedAt)/1000<need)throw new Error('Keep watching until the video ends. Skipping ahead does not count.');
  const res=await Evaluation.updateOne({user:q.user.id,task:t._id},{$setOnInsert:{answer:'watched'}},{upsert:true});
  if(!res.upsertedCount)throw new Error('Already counted');
  await User.updateOne({_id:q.user.id},{$inc:{balanceKes:t.rewardKes||0}});
  await Promise.all([tx(q.user.id,'video',t.rewardKes||0,t.title,t._id),WatchSession.deleteOne({_id:s._id})]);
  const vids=await Task.find({type:'video',...live}).distinct('_id');
  const[u,done]=await Promise.all([User.findById(q.user.id).select('balanceKes').lean(),Evaluation.countDocuments({user:q.user.id,task:{$in:vids}})]);
  r.json({ok:true,rewardKes:t.rewardKes||0,balanceKes:u.balanceKes,done,total:vids.length});
}));

// ---------- admin: tasks ----------
// add a survey or app-testing task
app.post('/api/admin/tasks',auth,admin,wrap(async(q,r)=>{
  const{title,type,url,description}=q.body,rewardKes=+q.body.rewardKes;
  if(!['survey','app'].includes(type))throw new Error('Choose survey or app testing (add videos with the video form)');
  if(!String(title||'').trim())throw new Error('Add a title');
  if(!httpUrl(url))throw new Error('The link must start with http:// or https://');
  if(!(rewardKes>=0))throw new Error('Enter the reward in KES');
  const t=await Task.create({title:String(title).trim().slice(0,140),type,url,rewardKes,description:String(description||'').slice(0,600)});
  await audit(q,'task.create',t.title,type);r.json(t);
}));
// paste many YouTube links at once (one per line, optional "link | title"). Same reward and description for the batch.
app.post('/api/admin/videos',auth,admin,wrap(async(q,r)=>{
  const rewardKes=+q.body.rewardKes;if(!(rewardKes>=0))throw new Error('Enter the reward in KES');
  const description=String(q.body.description||'').slice(0,600),durationSec=Math.max(0,+q.body.durationSec||0)||undefined;
  const lines=String(q.body.links||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,100),skipped=[],items=[];
  for(const line of lines){const[link,...t]=line.split('|'),id=ytId(link);if(!id){skipped.push(line);continue}
    if(!items.some(i=>i.id===id))items.push({id,title:t.join('|').trim()})}
  if(!items.length)throw new Error('No valid YouTube links found');
  const have=new Set(await Task.find({videoId:{$in:items.map(i=>i.id)}}).distinct('videoId'));
  const fresh=items.filter(i=>!have.has(i.id));
  const docs=await Promise.all(fresh.map(async i=>({type:'video',videoId:i.id,url:'https://www.youtube.com/watch?v='+i.id,title:(i.title||await ytTitle(i.id)).slice(0,140),rewardKes,description,durationSec})));
  if(docs.length)for(const d of docs)await Task.create(d); // one by one so they keep the order you pasted them in
  await audit(q,'video.add',docs.length+' video'+(docs.length===1?'':'s'),'reward '+rewardKes+' KES');
  r.json({added:docs.length,duplicates:items.length-fresh.length,skipped});
}));
// every task with how many users finished it. ?type= and ?q= filter. Videos come back in play order.
app.get('/api/admin/tasks',auth,admin,wrap(async(q,r)=>{
  const f={};if(['video','survey','app'].includes(q.query.type))f.type=q.query.type;
  if(q.query.q){const rx=rxOf(q.query.q);f.$or=[{title:rx},{description:rx}]}
  const tasks=await Task.find(f).sort(q.query.type==='video'?ORDER:'-createdAt').limit(500).lean();
  const c=await Evaluation.aggregate([{$match:{task:{$in:tasks.map(t=>t._id)}}},{$group:{_id:'$task',n:{$sum:1}}}]),cm=Object.fromEntries(c.map(x=>[String(x._id),x.n]));
  r.json(tasks.map(t=>({...t,finished:cm[String(t._id)]||0})));
}));
app.post('/api/admin/tasks/bulk',auth,admin,wrap(async(q,r)=>{
  const ids=(Array.isArray(q.body.ids)?q.body.ids:[]).filter(isId).slice(0,500),a=q.body.action;
  if(!ids.length)throw new Error('Select at least one task');
  if(a==='show'||a==='hide')await Task.updateMany({_id:{$in:ids}},{active:a==='show'});
  else if(a==='delete'){await Task.deleteMany({_id:{$in:ids}});await WatchSession.deleteMany({task:{$in:ids}})}
  else throw new Error('Unknown action');
  await audit(q,'task.bulk.'+a,ids.length+' task'+(ids.length===1?'':'s'));r.json({ok:true,count:ids.length});
}));
app.post('/api/admin/tasks/:id/update',auth,admin,wrap(async(q,r)=>{
  const t=await Task.findById(q.params.id);if(!t)throw new Error('Task not found');
  const b=q.body,title=String(b.title??t.title).trim(),rewardKes=b.rewardKes===undefined?t.rewardKes:+b.rewardKes;
  if(!title)throw new Error('Add a title');if(!(rewardKes>=0))throw new Error('Enter the reward in KES');
  t.title=title.slice(0,140);t.rewardKes=rewardKes;if(b.description!==undefined)t.description=String(b.description).slice(0,600);
  if(t.type==='video'){if(b.durationSec!==undefined)t.durationSec=Math.max(0,+b.durationSec||0)||undefined}
  else if(b.url!==undefined){if(!httpUrl(b.url))throw new Error('The link must start with http:// or https://');t.url=b.url}
  await t.save();await audit(q,'task.edit',t.title);r.json(t);
}));
app.post('/api/admin/tasks/:id/toggle',auth,admin,wrap(async(q,r)=>{
  const t=await Task.findById(q.params.id);if(!t)throw new Error('Task not found');t.active=t.active===false;await t.save();
  await audit(q,t.active?'task.show':'task.hide',t.title);r.json({active:t.active});
}));
// move a task one place earlier or later among tasks of its type
app.post('/api/admin/tasks/:id/move',auth,admin,wrap(async(q,r)=>{
  const t=await Task.findById(q.params.id);if(!t)throw new Error('Task not found');
  const ids=(await Task.find({type:t.type}).sort(ORDER).select('_id')).map(x=>String(x._id)),i=ids.indexOf(String(t._id)),j=q.body.dir==='up'?i-1:i+1;
  if(j>=0&&j<ids.length){[ids[i],ids[j]]=[ids[j],ids[i]];
    await Task.bulkWrite(ids.map((id,k)=>({updateOne:{filter:{_id:id},update:{$set:{pos:k+1}}}})))}
  r.json({ok:true});
}));
app.post('/api/admin/tasks/:id/delete',auth,admin,wrap(async(q,r)=>{
  const t=await Task.findById(q.params.id);
  await Task.deleteOne({_id:q.params.id});await WatchSession.deleteMany({task:q.params.id});await audit(q,'task.delete',t?.title);r.json({ok:true});
}));

// ---------- admin password gate ----------
const gateToken=u=>jwt.sign({gate:true,id:String(u)},GATE_SECRET(),{algorithm:'HS256',expiresIn:'12h'});
const gateTries=new Map(); // user id -> {n,until}; five wrong passwords lock the gate for 15 minutes
const gateBlocked=id=>{const t=gateTries.get(id);return t&&t.until>Date.now()?Math.ceil((t.until-Date.now())/60000):0};
const gateFail=id=>{const t=gateTries.get(id)||{n:0,until:0};t.n++;if(t.n>=5){t.until=Date.now()+15*60000;t.n=0}gateTries.set(id,t)};
app.get('/api/admin/gate',auth,adminBase,wrap(async(q,r)=>{
  const has=gateExists||(gateExists=!!await Setting.findOne({key:'adminGateHash'}));
  r.json({state:!has?'setup':gateOpen(q)?'open':'locked'})}));
app.post('/api/admin/gate/setup',auth,adminBase,wrap(async(q,r)=>{
  if(await Setting.findOne({key:'adminGateHash'}))throw new Error('An admin password already exists. Use Change password in Settings.');
  const{password,confirm}=q.body,pr=pwProblem(password);if(pr)throw new Error(pr);
  if(password!==confirm)throw new Error('Passwords do not match');
  await setSetting('adminGateHash',await bcrypt.hash(password,10));await audit(q,'admin-password','created');
  r.json({token:gateToken(q.user.id)})}));
app.post('/api/admin/gate/unlock',auth,adminBase,wrap(async(q,r)=>{
  const wait=gateBlocked(q.user.id);if(wait)throw new Error('Too many wrong passwords. Try again in '+wait+' minutes.');
  const h=await Setting.findOne({key:'adminGateHash'});if(!h)throw new Error('Create your admin password first');
  if(!await bcrypt.compare(String(q.body.password||''),h.value)){gateFail(q.user.id);throw new Error('Wrong admin password')}
  gateTries.delete(q.user.id);r.json({token:gateToken(q.user.id)})}));
app.post('/api/admin/gate/change',auth,admin,wrap(async(q,r)=>{
  const h=await Setting.findOne({key:'adminGateHash'});
  if(!await bcrypt.compare(String(q.body.current||''),h.value))throw new Error('Your current admin password is wrong');
  const{password,confirm}=q.body,pr=pwProblem(password);if(pr)throw new Error(pr);
  if(password!==confirm)throw new Error('New passwords do not match');
  await setSetting('adminGateHash',await bcrypt.hash(password,10));await audit(q,'admin-password','changed');r.json({ok:true})}));

// ---------- wallpaper picture for the landing page and login page ----------
// Kept in memory after the first read, so visitors never wait on the database for it. Stored as raw bytes (base64 text would be a third bigger).
let wall=null,wallLoaded=false; // {v,type,buf}
const sniff=b=>{if(!b||b.length<16)return null;
  if(b[0]===0xFF&&b[1]===0xD8&&b[2]===0xFF)return 'image/jpeg';
  if(b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A])))return 'image/png';
  if(b.subarray(0,4).toString('latin1')==='RIFF'&&b.subarray(8,12).toString('latin1')==='WEBP')return 'image/webp';
  return null};
const loadWall=async()=>{
  const[img,ver]=await Promise.all([Setting.findOne({key:'wallpaper'}),Setting.findOne({key:'wallpaperV'}).lean()]);
  wall=null;if(!img)return;
  let buf=img.bin&&img.bin.length?Buffer.from(img.bin):null;
  if(!buf){ // older versions saved a base64 text string: convert it once
    const m=/^data:image\/(?:jpeg|png|webp);base64,(.+)$/s.exec(img.value||'');
    if(m){buf=Buffer.from(m[1],'base64');await Setting.updateOne({key:'wallpaper'},{value:'bin',bin:buf})}}
  const type=sniff(buf);if(type)wall={v:ver?ver.value:'1',type,buf};
};
const needWall=async()=>{if(!wallLoaded){await loadWall();wallLoaded=true}};
app.get('/wallpaper',wrap(async(q,r)=>{
  await needWall();r.set('Cache-Control','public, max-age=300, stale-while-revalidate=86400');
  if(!wall)return r.status(404).end();
  const tag='"'+wall.v+'"';r.set({'Content-Type':wall.type,ETag:tag});
  if(q.headers['if-none-match']===tag)return r.status(304).end();
  r.send(wall.buf)}));
app.post('/api/admin/wallpaper',auth,admin,jsonBig,wrap(async(q,r)=>{
  const m=/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String((q.body||{}).image||''));
  if(!m)throw new Error('Choose a JPG, PNG or WebP picture');
  const buf=Buffer.from(m[1],'base64'),type=sniff(buf); // the real file type is checked, not just what the upload says it is
  if(!type)throw new Error('That file is not a valid picture');
  if(buf.length>600*1024)throw new Error('That picture is too large. Try a smaller one.');
  const v=String(Date.now());
  await Setting.updateOne({key:'wallpaper'},{value:'bin',bin:buf},{upsert:true});await setSetting('wallpaperV',v);
  wall={v,type,buf};wallLoaded=true;await audit(q,'settings','wallpaper updated');r.json({ok:true,v})}));
app.post('/api/admin/wallpaper/remove',auth,admin,wrap(async(q,r)=>{
  await Setting.deleteMany({key:{$in:['wallpaper','wallpaperV']}});wall=null;wallLoaded=true;await audit(q,'settings','wallpaper removed');r.json({ok:true})}));

// ---------- admin: settings, banner, payout day ----------
app.get('/api/admin/settings',auth,admin,wrap(async(q,r)=>{await needWall();r.json({...await getCfg(),hasWallpaper:!!wall,wallpaperV:wall?wall.v:''})}));
app.post('/api/admin/settings',auth,admin,wrap(async(q,r)=>{
  const b=q.body,changed=[];
  if(b.payoutDate!==undefined){const d=String(b.payoutDate);if(d&&isNaN(new Date(d)))throw new Error('That date is not valid');await setSetting('payoutDate',d);changed.push('payout date')}
  if(b.announcement!==undefined){await setSetting('announcement',String(b.announcement).slice(0,200));changed.push('banner')}
  for(const k of['referrerKes','joinKes'])if(b[k]!==undefined){const v=+b[k];if(!(v>=0&&v<=100000))throw new Error('Bonus amounts must be between 0 and 100000 KES');await setSetting(k,v);changed.push(k==='joinKes'?'join bonus':'referral bonus')}
  if(b.signupsOpen!==undefined){await setSetting('signupsOpen',b.signupsOpen?'1':'0');changed.push(b.signupsOpen?'sign-ups opened':'sign-ups paused')}
  if(changed.length)await audit(q,'settings',changed.join(', '));
  r.json(await getCfg());
}));
// ---------- public announcement banner ----------
app.get('/api/announcement',wrap(async(q,r)=>{r.set('Cache-Control','public, max-age=30');r.json({text:(await getCfg()).announcement})}));

// ---------- admin: overview ----------
const days=n=>Array.from({length:n},(_,i)=>new Date(Date.now()-(n-1-i)*864e5).toISOString().slice(0,10));
const byDay=(rows,D,k='n')=>D.map(d=>rows.find(x=>x._id===d)?.[k]||0);
// count (or sum a field) per calendar day, using the createdAt time
const perDay=(Model,match,field)=>Model.aggregate([{$match:match},{$group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$createdAt'}},n:{$sum:field?'$'+field:1}}}]);
const ovCache=new Map();
// The totals that need a pass over a whole collection are worked out once for 5 minutes and shared by all four ranges.
const heavy=()=>cached('heavy',300000,()=>Promise.all([
  User.aggregate([{$group:{_id:null,t:{$sum:'$balanceKes'}}}]),
  User.aggregate([{$group:{_id:'$country',n:{$sum:1}}},{$sort:{n:-1}},{$limit:8}]),
  Task.aggregate([{$group:{_id:'$type',n:{$sum:1}}}]),
  Evaluation.aggregate([{$group:{_id:'$task',n:{$sum:1}}},{$sort:{n:-1}},{$limit:5}]),
  User.countDocuments({banned:true}),User.countDocuments({referredBy:{$ne:null}})]));
const ovBuild=async n=>{
  const D=days(n),since=new Date(Date.now()-n*864e5),today=D[n-1];
  const w1=new Date(Date.now()-7*864e5),w2=new Date(Date.now()-14*864e5),D7=days(7)[0];
  const sumKes=m=>Transaction.aggregate([{$match:m},{$group:{_id:null,t:{$sum:'$amountKes'}}}]).then(a=>a[0]?.t||0);
  const [total,tasks,liveTasks,evals,logins,signups,evs,earned,todayLogins,active7,su1,su2,ev1,ev2,pay1,pay2,recent,recentTx,recentAudit,H]=await Promise.all([
    User.estimatedDocumentCount(),Task.estimatedDocumentCount(),Task.countDocuments(live),Evaluation.estimatedDocumentCount(),
    LoginLog.aggregate([{$match:{day:{$gte:D[0]}}},{$group:{_id:'$day',n:{$sum:1}}}]),
    perDay(User,{createdAt:{$gte:since}}),
    perDay(Evaluation,{createdAt:{$gte:since}}),
    perDay(Transaction,{createdAt:{$gte:since},amountKes:{$gt:0}},'amountKes'),
    LoginLog.countDocuments({day:today}),
    LoginLog.aggregate([{$match:{day:{$gte:D7}}},{$group:{_id:'$user'}},{$count:'n'}]), // only the number comes back, not every user id
    User.countDocuments({createdAt:{$gte:w1}}),User.countDocuments({createdAt:{$gte:w2,$lt:w1}}),
    Evaluation.countDocuments({createdAt:{$gte:w1}}),Evaluation.countDocuments({createdAt:{$gte:w2,$lt:w1}}),
    sumKes({createdAt:{$gte:w1},amountKes:{$gt:0}}),sumKes({createdAt:{$gte:w2,$lt:w1},amountKes:{$gt:0}}),
    User.find().select('username email country createdAt').sort('-createdAt').limit(8).lean(),
    Transaction.find().sort('-createdAt').limit(10).lean(),
    AuditLog.find().sort('-createdAt').limit(6).lean(),
    heavy()]);
  const [bal,countries,types,topEv,banned,refd]=H;
  const [tl,ul]=await Promise.all([Task.find({_id:{$in:topEv.map(x=>x._id)}}).select('title type').lean(),User.find({_id:{$in:recentTx.map(x=>x.user)}}).select('username email').lean()]);
  const tmap=idMap(tl),umap=idMap(ul);
  const out={total,banned,tasks,liveTasks,evals,referred:refd,balanceKes:bal[0]?.t||0,activeToday:todayLogins,active7:active7[0]?.n||0,
    delta:{signups:[su1,su2],evals:[ev1,ev2],paid:[pay1,pay2]},
    days:D,logins:byDay(logins,D),signups:byDay(signups,D),evaluations:byDay(evs,D),earned:byDay(earned,D),
    countries:countries.map(c=>({country:c._id,n:c.n})),types:types.map(t=>({type:t._id,n:t.n})),
    topTasks:topEv.map(x=>({title:tmap[String(x._id)]?.title||'(deleted)',type:tmap[String(x._id)]?.type,n:x.n})),
    recent,recentTx:recentTx.map(x=>({...x,user:umap[String(x.user)]?.username||umap[String(x.user)]?.email||'(deleted)'})),recentAudit};
  ovCache.set(n,{exp:Date.now()+30000,data:out});return out;
};
// one build at a time per range; an old answer (up to 10 minutes) is sent at once while a fresh one is built behind it
const ovInflight=new Map();
const ovGet=n=>{if(!ovInflight.has(n))ovInflight.set(n,ovBuild(n).finally(()=>ovInflight.delete(n)));return ovInflight.get(n)};
app.get('/api/admin/overview',auth,admin,wrap(async(q,r)=>{
  const n=[7,14,30,90].includes(+q.query.range)?+q.query.range:14,hit=ovCache.get(n),now=Date.now();
  if(hit&&!q.query.fresh&&now-hit.exp<600000){if(hit.exp<=now)ovGet(n).catch(()=>{});return r.json(hit.data)}
  if(q.query.fresh)memo.delete('heavy');
  r.json(await ovGet(n));
}));

// ---------- admin: users ----------
const userFilter=qs=>{
  const f={};
  if(qs.q){const rx=rxLow(qs.q);f.$or=[{username:rx},{email:rx}]}
  if(qs.status==='banned')f.banned=true;else if(qs.status==='active')f.banned={$ne:true};else if(qs.status==='admin')f.isAdmin=true;
  if(qs.country)f.country=String(qs.country).slice(0,3);
  return f};
const USER_SORT={new:'-createdAt',old:'createdAt',balance:'-balanceKes',login:'-lastLoginAt',name:'username'};
const usort=k=>Object.hasOwn(USER_SORT,k)?USER_SORT[k]:'-createdAt';
const refCounts=async ids=>Object.fromEntries((await User.aggregate([{$match:{referredBy:{$in:ids}}},{$group:{_id:'$referredBy',n:{$sum:1}}}])).map(x=>[String(x._id),x.n]));
// paged list. ?q= ?status=active|banned|admin ?country=XX ?sort=new|old|balance|login|name ?page= ?limit=
app.get('/api/admin/users',auth,admin,wrap(async(q,r)=>{
  const f=userFilter(q.query),page=Math.min(100000,Math.max(1,+q.query.page||1)),limit=[10,25,50,100].includes(+q.query.limit)?+q.query.limit:25;
  // the count and the page are fetched at the same time; with no filter the count is read from collection metadata (instant)
  const[total,users]=await Promise.all([Object.keys(f).length?User.countDocuments(f):User.estimatedDocumentCount(),
    User.find(f).select('-pass -pwAt -adminNote').sort(usort(q.query.sort)).skip((page-1)*limit).limit(limit).lean()]);
  const counts=await refCounts(users.map(u=>u._id));
  r.json({items:users.map(u=>({...u,referrals:counts[String(u._id)]||0,loginDays:u.loginDays||0})),total,page,limit,pages:Math.max(1,Math.ceil(total/limit))});
}));
// spreadsheet export of the same filter (cells that look like formulas are neutralised)
app.get('/api/admin/users.csv',auth,admin,wrap(async(q,r)=>{
  const users=await User.find(userFilter(q.query)).select('username email country balanceKes banned isAdmin createdAt lastLoginAt').sort(usort(q.query.sort)).limit(20000).lean(),counts=await refCounts(users.map(u=>u._id));
  const cell=v=>{v=String(v??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const rows=[['username','email','country','balance_kes','referrals','status','admin','joined','last_login']].concat(users.map(u=>[u.username,u.email,u.country,u.balanceKes,counts[String(u._id)]||0,u.banned?'banned':'active',u.isAdmin?'yes':'',u.createdAt?.toISOString(),u.lastLoginAt?.toISOString()||'']));
  await audit(q,'users.export',users.length+' rows');
  r.set('Content-Type','text/csv; charset=utf-8').send(rows.map(x=>x.map(cell).join(',')).join('\n'));
}));
app.post('/api/admin/users/bulk-ban',auth,admin,wrap(async(q,r)=>{
  const ids=(Array.isArray(q.body.ids)?q.body.ids:[]).filter(x=>isId(x)&&x!==q.user.id).slice(0,500),banned=!!q.body.banned;
  if(!ids.length)throw new Error('Select at least one user');
  const res=await User.updateMany({_id:{$in:ids},isAdmin:{$ne:true}},{banned,banReason:banned?String(q.body.reason||'').slice(0,200):''});
  await audit(q,banned?'users.ban':'users.unban',res.modifiedCount+' users',String(q.body.reason||'').slice(0,200));r.json({count:res.modifiedCount});
}));
app.get('/api/admin/users/:id',auth,admin,wrap(async(q,r)=>{
  const u=await User.findById(q.params.id).select('-pass -pwAt').populate('referredBy','username email');
  if(!u)throw new Error('User not found');
  const[referred,logins,evaluations,txns]=await Promise.all([
    User.find({referredBy:u._id}).select('username email country balanceKes createdAt banned').sort('-createdAt'),
    LoginLog.find({user:u._id}).sort('-day').limit(30),Evaluation.countDocuments({user:u._id}),
    Transaction.find({user:u._id}).sort('-createdAt').limit(15).lean()]);
  r.json({user:u,referred,logins,evaluations,txns});
}));
app.post('/api/admin/users/:id/ban',auth,admin,wrap(async(q,r)=>{
  if(q.params.id===q.user.id)throw new Error('You cannot ban yourself');
  const banned=!!q.body.banned,u=await User.findByIdAndUpdate(q.params.id,{banned,banReason:banned?String(q.body.reason||'').slice(0,200):''});
  await audit(q,banned?'user.ban':'user.unban',u?.username||u?.email,banned?String(q.body.reason||'').slice(0,200):'');r.json({ok:true});
}));
// add or remove money by hand. Always needs a reason, and shows up in the ledger and audit log.
app.post('/api/admin/users/:id/adjust',auth,admin,wrap(async(q,r)=>{
  const amount=+q.body.amountKes,note=String(q.body.note||'').trim().slice(0,200);
  if(!Number.isFinite(amount)||amount===0||Math.abs(amount)>1e6)throw new Error('Enter an amount in KES (negative to remove)');
  if(!note)throw new Error('Add a short reason so the ledger makes sense later');
  const f={_id:q.params.id};if(amount<0)f.balanceKes={$gte:-amount};
  const res=await User.updateOne(f,{$inc:{balanceKes:amount}});
  if(!res.matchedCount)throw new Error(amount<0?'Their balance is lower than that':'User not found');
  const u=await User.findById(q.params.id).select('username email balanceKes');
  await tx(u._id,'adjust',amount,note,null,q.user.id);await audit(q,'user.adjust',u.username||u.email,(amount>0?'+':'')+amount+' KES: '+note);
  r.json({balanceKes:u.balanceKes});
}));
app.post('/api/admin/users/:id/note',auth,admin,wrap(async(q,r)=>{
  await User.updateOne({_id:q.params.id},{adminNote:String(q.body.note||'').slice(0,1000)});r.json({ok:true});
}));
app.post('/api/admin/users/:id/role',auth,admin,wrap(async(q,r)=>{
  if(q.params.id===q.user.id)throw new Error('You cannot change your own role');
  const isAdmin=!!q.body.isAdmin,u=await User.findByIdAndUpdate(q.params.id,{isAdmin});if(!u)throw new Error('User not found');
  await audit(q,isAdmin?'user.promote':'user.demote',u.username||u.email);r.json({ok:true});
}));
// make a one-time password to hand to someone who is locked out. Shown once, never stored in plain text.
const tempPassword=()=>{const U='ABCDEFGHJKLMNPQRSTUVWXYZ',L='abcdefghijkmnpqrstuvwxyz',N='23456789',S='!@#$%&*?',all=U+L+N+S,pick=s=>s[crypto.randomInt(s.length)];
  const a=[pick(U),pick(L),pick(N),pick(S)];while(a.length<12)a.push(pick(all));
  for(let i=a.length-1;i>0;i--){const j=crypto.randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.join('')};
app.post('/api/admin/users/:id/reset-password',auth,admin,wrap(async(q,r)=>{
  const u=await User.findById(q.params.id);if(!u)throw new Error('User not found');
  const temp=tempPassword();u.pass=await bcrypt.hash(temp,10);u.pwAt=new Date();await u.save(); // pwAt: every login made before this moment stops working
  await audit(q,'user.reset-password',u.username||u.email);r.json({password:temp});
}));
app.post('/api/admin/users/:id/delete',auth,admin,wrap(async(q,r)=>{
  if(q.params.id===q.user.id)throw new Error('You cannot delete yourself');
  const u=await User.findById(q.params.id);if(!u)throw new Error('User not found');
  if(u.isAdmin)throw new Error('Remove their admin role first');
  const id=u._id;
  await Promise.all([Evaluation.deleteMany({user:id}),WatchSession.deleteMany({user:id}),LoginLog.deleteMany({user:id}),Transaction.deleteMany({user:id}),
    User.updateMany({referredBy:id},{$unset:{referredBy:1}}),User.deleteOne({_id:id})]);
  await audit(q,'user.delete',u.username||u.email);r.json({ok:true});
}));

// ---------- admin: submissions (survey answers, app feedback, watched videos) ----------
app.get('/api/admin/submissions',auth,admin,wrap(async(q,r)=>{
  const page=Math.max(1,+q.query.page||1),limit=20,f={};
  if(['video','survey','app'].includes(q.query.type))f.task={$in:await Task.find({type:q.query.type}).distinct('_id')};
  if(q.query.q){const rx=rxOf(q.query.q),rl=rxLow(q.query.q),uids=await User.find({$or:[{username:rl},{email:rl}]}).distinct('_id');f.$or=[{user:{$in:uids}},{answer:rx}]}
  const total=await Evaluation.countDocuments(f),items=await Evaluation.find(f).sort('-createdAt').skip((page-1)*limit).limit(limit).lean();
  const um=idMap(await User.find({_id:{$in:items.map(e=>e.user)}}).select('username email').lean()),tm=idMap(await Task.find({_id:{$in:items.map(e=>e.task)}}).select('title type rewardKes').lean());
  r.json({total,page,pages:Math.max(1,Math.ceil(total/limit)),items:items.map(e=>({_id:e._id,answer:e.answer,createdAt:e.createdAt,user:um[String(e.user)]||null,task:tm[String(e.task)]||null}))});
}));
// remove a submission so the person can do the task again; optionally take the reward back
app.post('/api/admin/submissions/:id/revoke',auth,admin,wrap(async(q,r)=>{
  const e=await Evaluation.findById(q.params.id);if(!e)throw new Error('Submission not found');
  const t=await Task.findById(e.task),u=await User.findById(e.user).select('username email balanceKes');
  await Evaluation.deleteOne({_id:e._id});await WatchSession.deleteOne({user:e.user,task:e.task});
  let taken=0;
  if(q.body.refund&&t?.rewardKes&&u){taken=Math.min(u.balanceKes||0,t.rewardKes);
    if(taken>0){const res=await User.updateOne({_id:u._id,balanceKes:{$gte:taken}},{$inc:{balanceKes:-taken}});
      if(res.modifiedCount)await tx(u._id,'revoke',-taken,'Revoked: '+t.title,t._id,q.user.id);else taken=0}}
  await audit(q,'submission.revoke',(u?.username||u?.email||'?')+' / '+(t?.title||'?'),taken?'took back '+taken+' KES':'reward kept');
  r.json({ok:true,takenKes:taken});
}));

// ---------- admin: money ledger, audit log, leaderboard, referrals ----------
app.get('/api/admin/transactions',auth,admin,wrap(async(q,r)=>{
  const page=Math.max(1,+q.query.page||1),limit=30,f={};
  if(q.query.kind)f.kind=String(q.query.kind);
  if(q.query.q){const rl=rxLow(q.query.q),uids=await User.find({$or:[{username:rl},{email:rl}]}).distinct('_id');f.user={$in:uids}}
  const total=Object.keys(f).length?await Transaction.countDocuments(f):await Transaction.estimatedDocumentCount(),items=await Transaction.find(f).sort('-createdAt').skip((page-1)*limit).limit(limit).lean();
  const um=idMap(await User.find({_id:{$in:items.map(x=>x.user)}}).select('username email').lean());
  const sum=m=>{const run=()=>Transaction.aggregate([{$match:{...f,...m}},{$group:{_id:null,t:{$sum:'$amountKes'}}}]).then(a=>a[0]?.t||0);
    return q.query.q?run():cached('txsum:'+(f.kind||'')+(m.amountKes.$gt!==undefined?'+':'-'),60000,run)}; // totals over the whole ledger are kept for a minute
  const[paid,removed]=await Promise.all([sum({amountKes:{$gt:0}}),sum({amountKes:{$lt:0}})]);
  r.json({total,page,pages:Math.max(1,Math.ceil(total/limit)),paidKes:paid,removedKes:removed,
    items:items.map(x=>({...x,user:um[String(x.user)]?.username||um[String(x.user)]?.email||'(deleted)'}))});
}));
app.get('/api/admin/audit',auth,admin,wrap(async(q,r)=>{
  const page=Math.max(1,+q.query.page||1),limit=30,total=await AuditLog.countDocuments();
  r.json({total,page,pages:Math.max(1,Math.ceil(total/limit)),items:await AuditLog.find().sort('-createdAt').skip((page-1)*limit).limit(limit).lean()});
}));
app.get('/api/admin/leaderboard',auth,admin,wrap(async(q,r)=>{
  r.json(await cached('leaderboard',60000,async()=>{ // three whole-collection passes, so the answer is kept for a minute
    const top=await User.find({banned:{$ne:true}}).select('username email country balanceKes').sort('-balanceKes').limit(20).lean();
    const pull=async rows=>{const m=idMap(await User.find({_id:{$in:rows.map(x=>x._id)}}).select('username email country balanceKes').lean());
      return rows.filter(x=>m[String(x._id)]).map(x=>({n:x.n,username:m[String(x._id)].username,email:m[String(x._id)].email,country:m[String(x._id)].country,balanceKes:m[String(x._id)].balanceKes}))};
    const[ref,work]=await Promise.all([User.aggregate([{$match:{referredBy:{$ne:null}}},{$group:{_id:'$referredBy',n:{$sum:1}}},{$sort:{n:-1}},{$limit:20}]),
      Evaluation.aggregate([{$group:{_id:'$user',n:{$sum:1}}},{$sort:{n:-1}},{$limit:20}])]);
    const[referrers,workers]=await Promise.all([pull(ref),pull(work)]);
    return{richest:top,referrers,workers}}));
}));
app.get('/api/admin/referrals',auth,admin,wrap(async(q,r)=>r.json(await User.find({referredBy:{$ne:null}}).select('username email country createdAt banned').populate('referredBy','username email').sort('-createdAt').limit(300))));

const PORT=process.env.PORT||3000;
// One time: set the invite reward to 80 KES per referral, even if an older value was saved. After this it can still be changed from the admin panel.
const resetGate=async()=>{if(String(process.env.RESET_ADMIN_PASSWORD).toLowerCase()==='true'){await Setting.deleteOne({key:'adminGateHash'});console.log('Admin password cleared. Open /mawira.html and create a new one, then remove RESET_ADMIN_PASSWORD from .env')}};
const startup=async()=>{
  await resetGate();
  // Make the database match models.js: drop indexes nobody uses any more, build the new ones (the TTL ones let old logs expire by themselves).
  for(const M of Object.values(models)){try{await M.syncIndexes()}catch(e){console.error('Index sync problem on',M.modelName,'-',e.message)}}
  // one time: count each person's login days from the old LoginLog rows (the rows now expire, the counter stays)
  if(!await Setting.findOne({key:'loginDaysDone'})){
    const rows=await LoginLog.aggregate([{$group:{_id:'$user',n:{$sum:1}}}]);
    for(let i=0;i<rows.length;i+=1000)await User.bulkWrite(rows.slice(i,i+1000).map(x=>({updateOne:{filter:{_id:x._id},update:{$set:{loginDays:x.n}}}})));
    await setSetting('loginDaysDone','1');
  }
  await needWall(); // also converts an old text wallpaper to raw bytes
  if(!(await Setting.findOne({key:'referral80Applied'}))){await setSetting('referrerKes',80);await setSetting('referral80Applied','1')}
};

// ---------- support chat (users talk to admins; the pages poll every few seconds, no extra packages) ----------
const REACTS=['heart','like','smile','check','star','bolt'];
const typing=new Map(); // "<userId>:<u|a>" -> last time that side typed
const isTyping=(uid,side)=>Date.now()-(typing.get(uid+':'+side)||0)<4000;
setInterval(()=>{const n=Date.now();for(const[k,t]of typing)if(n-t>10000)typing.delete(k)},30000).unref();
const cid=v=>{v=String(v||'');if(!/^[a-f0-9]{24}$/.test(v))throw new Error('That request was not valid');return v};
const pubMsg=m=>({id:m._id,from:m.from,text:m.deleted?'':m.text,reply:m.reply&&m.reply.id?m.reply:null,re:m.re||{},read:!!m.readAt,del:!!m.deleted,at:m.createdAt});
// side is 'u' (the user, thread = their own id) or 'a' (an admin, thread = :uid in the address)
const chatUid=(side,q)=>cid(side==='u'?q.user.id:q.params.uid);
const chatRoutes=(side,base,mw)=>{
  const other=side==='u'?'admin':'user',me=side==='u'?'user':'admin',oth=side==='u'?'a':'u';
  app.get(base,...mw,wrap(async(q,r)=>{const uid=chatUid(side,q);
    const rows=await ChatMsg.find({user:uid}).sort('-_id').limit(80).lean();
    r.json({msgs:rows.reverse().map(pubMsg),typing:isTyping(uid,oth)})}));
  app.post(base,...mw,rate('chat',40,60000,q=>q.user.id),wrap(async(q,r)=>{const uid=chatUid(side,q);
    const text=String(q.body.text||'').trim().slice(0,1000);if(!text)throw new Error('Type a message first');
    if(side==='a'&&!await User.exists({_id:uid}))throw new Error('That user no longer exists');
    let reply;if(q.body.reply){const o=await ChatMsg.findOne({_id:cid(q.body.reply),user:uid}).lean();if(o&&!o.deleted)reply={id:o._id,text:o.text.slice(0,80),from:o.from}}
    typing.delete(uid+':'+(side==='u'?'u':'a'));
    r.json({msg:pubMsg(await ChatMsg.create({user:uid,from:me,text,reply}))})}));
  app.post(base+'/read',...mw,wrap(async(q,r)=>{await ChatMsg.updateMany({user:chatUid(side,q),from:other,readAt:null},{readAt:new Date()});r.json({ok:1})}));
  app.post(base+'/typing',...mw,wrap(async(q,r)=>{typing.set(chatUid(side,q)+':'+side,Date.now());r.json({ok:1})}));
  app.post(base+'/react',...mw,wrap(async(q,r)=>{const uid=chatUid(side,q),k=String(q.body.r||'');if(k&&!REACTS.includes(k))throw new Error('That request was not valid');
    const m=await ChatMsg.findOne({_id:cid(q.body.id),user:uid}).lean();if(!m||m.deleted)throw new Error('Message not found');
    const f='re.'+side;await ChatMsg.updateOne({_id:m._id},!k||(m.re&&m.re[side]===k)?{$unset:{[f]:1}}:{$set:{[f]:k}});r.json({ok:1})}));
  app.post(base+'/delete',...mw,wrap(async(q,r)=>{const uid=chatUid(side,q);
    // people can unsend their own messages; admins can also remove a user's message
    const f={_id:cid(q.body.id),user:uid};if(side==='u')f.from='user';
    await ChatMsg.updateOne(f,{$set:{deleted:true,text:''},$unset:{re:1,reply:1}});r.json({ok:1})}));
};
app.get('/api/chat/unread',auth,wrap(async(q,r)=>r.json({n:await ChatMsg.countDocuments({user:q.user.id,from:'admin',readAt:null,deleted:null})})));
app.get('/api/admin/chats/unread',auth,admin,wrap(async(q,r)=>r.json({n:await ChatMsg.countDocuments({from:'user',readAt:null,deleted:null})})));
chatRoutes('u','/api/chat',[auth]);
chatRoutes('a','/api/admin/chats/:uid',[auth,admin]);
// inbox: one row per person, newest first. Typing a search also finds people who have never written, so an admin can start a chat.
app.get('/api/admin/chats',auth,admin,wrap(async(q,r)=>{
  const rows=await cached('chats',1500,()=>ChatMsg.aggregate([{$sort:{_id:-1}},{$group:{_id:'$user',last:{$first:'$$ROOT'},
    unread:{$sum:{$cond:[{$and:[{$eq:['$from','user']},{$eq:[{$ifNull:['$readAt',null]},null]},{$ne:['$deleted',true]}]},1,0]}}}},{$sort:{'last._id':-1}},{$limit:300}]));
  const s=String(q.query.q||'').trim().slice(0,60),F='username email country balanceKes banned createdAt lastLoginAt';
  const us=await User.find({_id:{$in:rows.map(x=>x._id)}}).select(F).lean(),by=new Map(us.map(u=>[String(u._id),u]));
  let out=rows.filter(x=>by.has(String(x._id))).map(x=>({user:by.get(String(x._id)),unread:x.unread,last:{from:x.last.from,text:x.last.deleted?'':x.last.text,del:!!x.last.deleted,at:x.last.createdAt}}));
  if(s){const rx=rxOf(s);out=out.filter(x=>rx.test(x.user.username||'')||rx.test(x.user.email||''));
    const have=new Set(out.map(x=>String(x.user._id)));
    for(const u of await User.find({$or:[{username:rx},{email:rx}]}).select(F).limit(10).lean())if(!have.has(String(u._id)))out.push({user:u,unread:0,last:null})}
  r.json({chats:out})}));

// never let one bad request take the whole server down
app.use((e,q,r,n)=>{console.error('Express error on',q.method,q.originalUrl,'-',e&&e.stack||e);if(r.headersSent)return n(e);const st=e&&e.status>=400&&e.status<500?e.status:500;
  r.status(st).json({error:st===500?'Server error':e.type==='entity.too.large'?'That request is too large':'That request was not valid'})});
process.on('unhandledRejection',e=>console.error('Unhandled rejection (server kept running):',e&&e.stack||e));
process.on('uncaughtException',e=>console.error('Uncaught exception (server kept running):',e&&e.stack||e));
if(require.main===module){
  const sec=String(process.env.JWT_SECRET||'');
  if(!process.env.MONGO_URI||!sec){console.error('Missing MONGO_URI or JWT_SECRET. Copy .env.example to .env and fill it in.');process.exit(1)}
  if(/^change-?me/i.test(sec)){console.error('JWT_SECRET is still the example value. Anyone could forge a login with it. Put a long random one in .env (see README), then start again.');process.exit(1)}
  if(sec.length<32)console.warn('WARNING: JWT_SECRET is short. Use 48+ random characters (see README) so logins cannot be guessed. Changing it logs everyone out once.');
  mongoose.connection.on('error',e=>console.error('MongoDB error:',e.message));
  // compressors: query results travel compressed between this server and Atlas (less data over a long distance)
  mongoose.connect(process.env.MONGO_URI,{maxPoolSize:20,minPoolSize:8,serverSelectionTimeoutMS:15000,compressors:'zlib'}).then(startup).then(()=>app.listen(PORT,()=>{console.log('Running on http://localhost:'+PORT);ovGet(14).catch(()=>{})})).catch(e=>{console.error('Could not start the server:',e.message);process.exit(1)});
}
module.exports=app;
