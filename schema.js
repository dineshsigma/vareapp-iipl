let mongoose=require('mongoose');
let Schema=mongoose.Schema;
let structure=new Schema({
    name:{
        type:"String",
        required:true
    },
    marks:{
        type:Number,
        required:true
    }
})
module.exports=structure