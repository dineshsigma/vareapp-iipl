const serverless = require('serverless-http');
const express = require('express')
const app = express();
const { v4: uuidv4 } = require('uuid');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var mongoclient = require('./mongodb');

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
app.post('/api/review/person',createReview);
app.post('/api/review/product',createProductReview);
app.get('/api/review/product',getProductReview);
app.get('/api/review/person',getPersonReview);
app.get('/api/review/product/user',getProductReviewUserId);

async function getProductReview(req,res)
{
  var data = req.query.productId;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
   var reviewsclient = await dataBase.collection('reviews');
  

var responce=await reviewsclient.find({productId:data,type:"product"}).toArray();
 res.json({"data":responce});
}
async function getProductReviewUserId(req,res)
{
  var data = req.query.productId;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
   var reviewsclient = await dataBase.collection('reviews');
  

var responce=await reviewsclient.findOne({productId:data,type:"product",reviewById:req.query.userId});
 res.json({"data":responce});
}

async function getPersonReview(req,res)
{
  var data = req.query.reviewToId;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
   var reviewsclient = await dataBase.collection('reviews');
  
  

var responce=await reviewsclient.find({reviewToId:data,type:"person"}).toArray();
 res.json({"data":responce});
}
async function createProductReview(req,res)
{
  var data = req.body;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
   var reviewsclient = await dataBase.collection('reviews');
   var userclient = await dataBase.collection('user');
   var userdata=await userclient.findOne({user_id:req.userId});
   req.body.reviewById=req.userId;
   req.body.createDate=new Date();
   req.body.id=uuidv4();
   req.body.type="product";
   req.body.byname=userdata.name;

var responce=await reviewsclient.insertOne(req.body);
 res.json({"inserted":responce.insertedCount!=0?true:false});
}
async function createReview(req,res)
{
  var data = req.body;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
   var reviewsclient = await dataBase.collection('reviews');
   var userclient = await dataBase.collection('user');
   var userdata=await userclient.findOne({user_id:req.userId});
   req.body.reviewById=req.userId;
   req.body.createDate=new Date();
   req.body.id=uuidv4();
   req.body.type="person";
   req.body.byname=userdata.name;

var responce=await reviewsclient.insertOne(req.body);
 res.json({"inserted":responce.insertedCount!=0?true:false});
}


module.exports.handler = serverless(app);