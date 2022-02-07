const serverless = require('serverless-http');
const express = require('express')
const app = express();
const { v4: uuidv4 } = require('uuid');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var mongoclient = require('./mongodb');
const {
  ObjectId
} = require('mongodb');
app.use(express.json());
app.use(cors());


var JWT_SECRET_KEY = 'dmFyZWFwcGl2b3J5aW5ub3ZhdGlvbnNoYXJpa3Jpc2huYTE3Mjk=';

// app.use(function (req, res, next) {
//     if (req.headers['x-user-auth'] == null) {
//         return res.status(401).json({ message: "Access Token missing" });
//     }
//     try {
//         console.log("req.headers['x-user-auth']", req.headers['x-user-auth']);
//         var decoded = jwt.verify(req.headers['x-user-auth'], JWT_SECRET_KEY);
//         req.userId = decoded.userId;
//         console.log("req.body----------",req.body,req.userId);
//         next();
//     } catch (err) {
//         // err
//         console.log("err----", err.message);
//         return res.status(401).json({ message: "Unauthorised" });
//     }
// });
app.post('/api/vendor/lead',createLead);
app.get('/api/vendor/lead',getLeads);
app.get('/api/vendor/get',getVendor);


async function createLead(req,res)
{
  var data = req.body;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
   var leadsclient = await dataBase.collection('leads');
  
   req.body.createDate=new Date();
   
   
  // req.body.byid=req.userId;

var responce=await leadsclient.insertOne(req.body);
 res.json({"inserted":responce.insertedCount!=0?true:false});
}

async function getLeads(req,res)
{
  var data = req.query.id;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
  var leadsclient = await dataBase.collection('leads');
  
  

var responce=await leadsclient.find({}).toArray();
 res.json({"data":responce});
}
async function getVendor(req,res)
{
  var data = req.query.id;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
  var vendorclient = await dataBase.collection('vendor');
  
  

var responce=await vendorclient.findOne({}).toArray();
 res.json({"data":responce});
}

async function getLeadByid(req,res)
{
  var data = req.query.id;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
  var leadsclient = await dataBase.collection('leads');
  
  

var responce=await leadsclient.findOne({_id:ObjectID(data)});
 res.json({"data":responce});
}
async function getVendorById(req,res)
{
  var data = req.query.id;
  console.log("data-----------",data);
  var dataBase = await mongoclient.connect();
  var vendorclient = await dataBase.collection('vendor');
  
  

var responce=await vendorclient.findOne({_id:ObjectID(data)});
 res.json({"data":responce});
}
app.post('/api/vendor/register', async function (req, res) {

  var form = req.body;


  // token verify
  console.log("TRIGGERED USER SAVE------------------------form",form);

      try {
        
         
              var dataBase = await mongoclient.connect();
              var userclient = await dataBase.collection('user');
              var vendorclient = await dataBase.collection('vendor');
              form.createdate=new Date();
              var vendor=await vendorclient.insertOne(form);
console.log("vendor-----",vendor);
var userobj={};
userobj.name=form.name;
userobj.email=form.email;
userobj.phone_no=form.phone_no;
userobj.type="user";
userobj.user_id=uuidv4();
userobj.created=new Date();
userobj.vendorId=ObjectId(vendor.insertedId).toString();
userobj.isVendorActive=false;

var user=await userclient.insertOne(userobj);
             
              res.json({
                  status: true,
                  message: "Success",
                 
              })
          

          
      } catch (err) {
          // err
          console.log("err", err);
          res.json({
              status: false,
              message: err.message
          });
      }
  


});
app.put('/api/vendor/update', async function (req, res) {

  var form = req.body;


  // token verify
  console.log("TRIGGERED Vendor update------------------------vip");

      try {
        
         
              var dataBase = await mongoclient.connect();
              var userclient = await dataBase.collection('user');
              var vendorclient = await dataBase.collection('vendor');
              
              var vendor=await vendorclient.findOneAndUpdate({_id:ObjectID(req.query.id)},{$set:form});

             
              res.json({
                  status: true,
                  message: "Success",
                 
              })
          

          
      } catch (err) {
          // err
          console.log("err", err);
          res.json({
              status: false,
              message: err.message
          });
      }
  


});


module.exports.handler = serverless(app);