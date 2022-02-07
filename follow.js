const serverless = require('serverless-http');
const express = require('express')
const app = express();
const { v4: uuidv4 } = require('uuid');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var mongoclient = require('./mongodb');
const { ObjectId } = require('mongodb');
const e = require('express');

app.use(express.json());
app.use(cors());


var JWT_SECRET_KEY = 'dmFyZWFwcGl2b3J5aW5ub3ZhdGlvbnNoYXJpa3Jpc2huYTE3Mjk=';

app.use(function (req, res, next) {
    if (req.headers['x-user-auth'] == null) {
        return res.status(401).json({ message: "Access Token missing" });
    }
    try {
        console.log("req.headers['x-user-auth']", req.headers['x-user-auth']);
        var decoded = jwt.verify(req.headers['x-user-auth'], JWT_SECRET_KEY);
        req.userId = decoded.userId;
        console.log("req.body----------",req.body,req.userId);
        next();
    } catch (err) {
        // err
        console.log("err----", err.message);
        return res.status(401).json({ message: "Unauthorised" });
    }
});
app.post('/api/follow/new', async function (req, res) {
  var data = req.body;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
   var followclient = await dataBase.collection('follow');
   var userclient = await dataBase.collection('user');
   var follow=await followclient.findOne({followById:req.userId,vendorId:req.body.vendorId});
   if(follow==null )
   {
    
   if(req.body.isFollow==null || req.body.isFollow==true)
   {
    var userdata=await userclient.findOne({user_id:req.userId});
    req.body.followById=req.userId;
    req.body.createDate=new Date();
    //req.body.id=uuidv4();
    //req.body.type="product";
    var userdata1=await userclient.findOneAndUpdate({user_id:req.body.vendorId},{$inc:{followers:1}},{upsert:true});
 
    req.body.followByName=userdata.name;
    req.body.isFollow=true;
 
 var responce=await followclient.insertOne(req.body);
  res.json({"inserted":responce.insertedCount!=0?true:false});
   }else{
res.json({"message":"no data found"});
   }
   }else{
    if(req.body.isFollow==null)
    {
      res.json({"message":" you  are following him"});

    }else
    {
      if(req.body.isFollow==false)
    {
     var userdata=await userclient.findOne({user_id:req.userId});
     req.body.followById=req.userId;
     req.body.createDate=new Date();
     //req.body.id=uuidv4();
     //req.body.type="product";
     var userdata1=await userclient.findOneAndUpdate({user_id:req.body.vendorId},{$inc:{followers:-1}},{upsert:true});
  
     
  
  var responce=await followclient.findOneAndUpdate({vendorId:req.body.vendorId,followById:req.userId},{$set:{isFollow:false}});
  res.json({"message":"you are successfully un following "});
   }else{
    var userdata=await userclient.findOne({user_id:req.userId});
    req.body.followById=req.userId;
    req.body.createDate=new Date();
    //req.body.id=uuidv4();
    //req.body.type="product";
    var userdata1=await userclient.findOneAndUpdate({user_id:req.body.vendorId},{$inc:{followers:1}},{upsert:true});
 
    
 
 var responce=await followclient.findOneAndUpdate({vendorId:req.body.vendorId,followById:req.userId},{$set:{isFollow:true}});
res.json({"message":"you are successfully following "});
   }
   }
   }
});

app.get('/api/follow', async function (req, res) {
  console.log("njdcbdjvbdfv")
  var data = req.query.userId;

  
    console.log("data-----------",data);
   
  // var productclient = await mongoclient.connect('products');
  
   var dataBase = await mongoclient.connect();
   var messagesclient=dataBase.collection('messages');
 

       
       var data= await messagesclient.find().toArray();
    
       
                     res.json({                        status: true,
                        message: "success",
                          data:data,
                         
                     
                        
                    });
        
             //   }
    
});


module.exports.handler = serverless(app);