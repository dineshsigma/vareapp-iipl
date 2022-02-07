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
        req.vendorId = decoded.vendorId;
        console.log("req.body----------",req.body,req.userId);
        next();
    } catch (err) {
        // err
        console.log("err----", err.message);
        return res.status(401).json({ message: "Unauthorised" });
    }
});
app.get('/api/promotion/',getPromotions);
app.post('/api/promotion/check', async function (req, res) {
    var data = req.body;
    console.log("data-----------",data);
    var dataBase = await mongoclient.connect();
     var promotionclient = await dataBase.collection('promotion');
     var userclient = await dataBase.collection('user');
     var promotion=await promotionclient.findOne({date:data.date,category:data.category});
     if(promotion==null )
     {
        data.createDate=new Date();
        data.vendorId=req.vendorId;
        if(data.paywith=="Amount")
        {
            data.status="pendding";
        }else{
            const update = await userclient.findOneAndUpdate({ "user_id": req.userId },{
                $inc: {
                  "points":-(data.points)
                }
              },);
        }
      
        var promotionin=await promotionclient.insertOne(data);
      
        console.log("promotionin.insertedId-------",promotionin.insertedId);
        res.json({status:true,"id":promotionin.insertedId,"message":"this slot is avilable"});
     
  
     }else{
      res.json({status:false,"message":"this slot is already booked "});
     }
     
     
  });
  
app.post('/api/promotion/paymentupdate', async function (req, res) {
  var data = req.body;
  console.log(" paymentupdate data-----------",data);
  var dataBase = await mongoclient.connect();
  var promotionclient = await dataBase.collection('promotion');
   const update = await promotionclient.findOneAndUpdate({_id:ObjectId(data.promotionId)},{
    $set: {
      "paymentId":data.paymentId,
      "status":"active"
    }
  },);
   
   res.json({status:true,});
   
});

async function getPromotions(req, res) {
    console.log("Promotions-------");
   
    var dataBase = await mongoclient.connect();

    var promotionclient = await dataBase.collection('promotion');

    console.log("userId---------------", req.userId);
    var response = await promotionclient.find({
        "vendorId": req.vendorId
    }).sort({
        created: -1
    }).toArray();
    console.log("tttttttttttt", response);
    res.json({
        status: true,
        data: response
    });
}


module.exports.handler = serverless(app);