const m=require('mongoose'),S=m.Schema;
// All money is stored in KES; the site shows USD first, local estimate below.
exports.User=m.model('User',new S({
  email:{type:String,unique:true,index:true},pass:String,country:String,
  refCode:{type:String,unique:true,index:true},referredBy:{type:S.Types.ObjectId,ref:'User'},
  deviceId:{type:String,index:true},balanceKes:{type:Number,default:0},
  isAdmin:{type:Boolean,default:false},verified:{type:Boolean,default:false}},{timestamps:true}));
exports.Task=m.model('Task',new S({title:String,type:{type:String,enum:['survey','video']},url:String,rewardKes:Number},{timestamps:true}));
exports.Evaluation=m.model('Evaluation',new S({user:S.Types.ObjectId,task:S.Types.ObjectId,answer:String},{timestamps:true}));
exports.Setting=m.model('Setting',new S({key:{type:String,unique:true},value:String}));
