const m=require('mongoose'),S=m.Schema,DAY=86400;
// Storage notes (MongoDB Atlas free tier is small, so every byte counts):
//  - rows that never change only keep createdAt (no updatedAt)
//  - no empty-string defaults, they would be stored on every row
//  - no duplicate indexes (a "unique" field is already indexed), every index costs disk and slows writes
//  - logs expire by themselves (TTL indexes). The money ledger is never deleted.
const created={timestamps:{createdAt:true,updatedAt:false}};

// All money is stored in KES; the site shows USD first, local estimate below.
exports.User=m.model('User',new S({
  email:{type:String,unique:true},
  // lowercase, 3-20 chars. sparse so accounts made before usernames existed still work.
  username:{type:String,unique:true,sparse:true},
  pass:String,country:String,
  refCode:{type:String,unique:true},referredBy:{type:S.Types.ObjectId,ref:'User'},
  balanceKes:{type:Number,default:0},
  banned:{type:Boolean,default:false},banReason:String,lastLoginAt:Date,
  loginDays:{type:Number,default:0}, // number of different days this person logged in (replaces counting LoginLog rows)
  pwAt:Date, // set when an admin resets the password: older login tokens stop working
  isAdmin:{type:Boolean,default:false},verified:Boolean,adminNote:String},{timestamps:true})
  .index({createdAt:-1}).index({referredBy:1}).index({balanceKes:-1}).index({lastLoginAt:-1}));

// type: survey | video | app (app testing). Videos are YouTube links; they play in order and a user watches each one once.
// durationSec (optional, videos): real length in seconds, used to check that people actually watched.
exports.Task=m.model('Task',new S({title:String,type:{type:String,enum:['survey','video','app']},url:String,rewardKes:Number,
  description:String,videoId:String,durationSec:Number,active:{type:Boolean,default:true},
  // play/display order. New tasks go to the end. Older tasks without it keep their createdAt order.
  pos:{type:Number,default:()=>Date.now()}},{timestamps:true}).index({type:1,active:1,pos:1}));

// one row per user per finished task (the unique index stops a reward being paid twice)
exports.Evaluation=m.model('Evaluation',new S({user:S.Types.ObjectId,task:S.Types.ObjectId,answer:String},created)
  .index({user:1,task:1},{unique:true}).index({createdAt:-1}).index({task:1}));

// when a user last pressed play on a video, so the server can check enough time has passed before paying.
// Deleted when the reward is paid; abandoned ones expire after 2 days.
exports.WatchSession=m.model('WatchSession',new S({user:S.Types.ObjectId,task:S.Types.ObjectId,startedAt:Date,clientDuration:Number})
  .index({user:1,task:1},{unique:true}).index({startedAt:1},{expireAfterSeconds:2*DAY}));

// bin holds the wallpaper picture as raw bytes (a base64 string would be a third bigger)
exports.Setting=m.model('Setting',new S({key:{type:String,unique:true},value:String,bin:Buffer}));

// one row per user per day they logged in. Rows expire after 100 days (the longest chart is 90 days).
exports.LoginLog=m.model('LoginLog',new S({user:S.Types.ObjectId,day:String,count:{type:Number,default:1}},created)
  .index({user:1,day:1},{unique:true}).index({day:1}).index({createdAt:1},{expireAfterSeconds:100*DAY}));

// money ledger: every balance change is one row. amountKes is signed (negative = removed). Never expires.
// kind: video | survey | app | referral | bonus | adjust | revoke
exports.Transaction=m.model('Transaction',new S({user:S.Types.ObjectId,kind:String,amountKes:Number,note:String,
  task:S.Types.ObjectId,by:S.Types.ObjectId},created).index({createdAt:-1}).index({user:1,createdAt:-1}));

// what admins did, newest first in the panel. Rows expire after 180 days.
exports.AuditLog=m.model('AuditLog',new S({admin:S.Types.ObjectId,adminName:String,action:String,target:String,detail:String},created)
  .index({createdAt:1},{expireAfterSeconds:180*DAY}));

// support chat: one running conversation per user (user = the person who owns the thread). from: user | admin.
// re = reactions, one per side ({u:'heart', a:'like'}). Messages expire after 60 days to keep MongoDB small.
exports.ChatMsg=m.model('ChatMsg',new S({user:S.Types.ObjectId,from:String,text:String,
  reply:{id:S.Types.ObjectId,text:String,from:String},re:{u:String,a:String},readAt:Date,deleted:Boolean},created)
  .index({user:1,_id:1}).index({from:1,readAt:1}).index({createdAt:1},{expireAfterSeconds:60*DAY}));
