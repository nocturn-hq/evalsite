require('dotenv').config();
const express=require('express'),mongoose=require('mongoose'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken');
const {User,Task,Evaluation,Setting}=require('./models');
const REFERRER_KES=40, JOIN_BONUS_KES=20, MAX_ACCOUNTS_PER_DEVICE=2;
const app=express();app.use(express.json());app.use(express.static('public'));

const sign=u=>jwt.sign({id:u._id,admin:u.isAdmin},process.env.JWT_SECRET,{expiresIn:'30d'});
const auth=(q,r,n)=>{try{q.user=jwt.verify((q.headers.authorization||'').slice(7),process.env.JWT_SECRET);n()}catch{r.status(401).json({error:'Please log in'})}};
const admin=(q,r,n)=>q.user.admin?n():r.status(403).json({error:'Admins only'});
// Gmail only. Dots and +tags are the same inbox, so strip them.
const gmail=e=>{e=String(e||'').trim().toLowerCase();const[l,d]=e.split('@');return d==='gmail.com'&&l?l.split('+')[0].replace(/\./g,'')+'@gmail.com':null};
const wrap=f=>(q,r)=>f(q,r).catch(e=>r.status(400).json({error:e.message}));

app.post('/api/signup',wrap(async(q,r)=>{
  const{password,country,deviceId,ref}=q.body,email=gmail(q.body.email);
  if(!email)throw new Error('Use a Gmail address (name@gmail.com)');
  if(!password||password.length<6)throw new Error('Password must be at least 6 characters');
  if(!country)throw new Error('Choose your country');
  if(await User.countDocuments({deviceId})>=MAX_ACCOUNTS_PER_DEVICE)throw new Error('This device already has 2 accounts');
  if(await User.findOne({email}))throw new Error('This email is already registered');
  const referrer=ref?await User.findOne({refCode:ref}):null;
  const u=await User.create({email,country,deviceId,pass:await bcrypt.hash(password,10),
    refCode:Math.random().toString(36).slice(2,8),referredBy:referrer?._id,
    balanceKes:referrer?JOIN_BONUS_KES:0,isAdmin:email===gmail(process.env.ADMIN_EMAIL)});
  if(referrer)await User.updateOne({_id:referrer._id},{$inc:{balanceKes:REFERRER_KES}}); // atomic
  // TODO: email a 6-digit code and set verified=true; decide when referral bonuses are credited
  r.json({token:sign(u)});
}));

app.post('/api/login',wrap(async(q,r)=>{
  const u=await User.findOne({email:gmail(q.body.email)});
  if(!u||!await bcrypt.compare(q.body.password||'',u.pass))throw new Error('Wrong email or password');
  r.json({token:sign(u)});
}));

app.get('/api/me',auth,wrap(async(q,r)=>{
  const u=await User.findById(q.user.id).select('-pass'),p=await Setting.findOne({key:'payoutDate'});
  r.json({user:u,payoutDate:p?.value||null,referrals:await User.countDocuments({referredBy:u._id})});
}));

app.get('/api/tasks',auth,wrap(async(q,r)=>{
  const done=(await Evaluation.find({user:q.user.id})).map(e=>e.task);
  r.json(await Task.find({_id:{$nin:done}}).sort('-createdAt'));
}));

app.post('/api/tasks/:id/evaluate',auth,wrap(async(q,r)=>{
  const t=await Task.findById(q.params.id);if(!t)throw new Error('Task not found');
  if(await Evaluation.findOne({user:q.user.id,task:t._id}))throw new Error('Already evaluated');
  await Evaluation.create({user:q.user.id,task:t._id,answer:q.body.answer});
  await User.updateOne({_id:q.user.id},{$inc:{balanceKes:t.rewardKes||0}});
  r.json({ok:true});
}));

app.post('/api/admin/tasks',auth,admin,wrap(async(q,r)=>r.json(await Task.create(q.body))));
app.post('/api/admin/payout-date',auth,admin,wrap(async(q,r)=>{
  await Setting.updateOne({key:'payoutDate'},{value:q.body.date},{upsert:true});r.json({ok:true});
  // TODO: on payout day, email each user their payout link
}));
app.get('/api/admin/users',auth,admin,wrap(async(q,r)=>r.json(await User.find().select('-pass').sort('-createdAt').limit(200))));

mongoose.connect(process.env.MONGO_URI).then(()=>app.listen(process.env.PORT||3000,()=>console.log('Running')));
