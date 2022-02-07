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

app.post('/api/ticket', async function (req, res) {
  var data = req.body;


  console.log("data-----------", data);

  // var productclient = await mongoclient.connect('products');

  var dataBase = await mongoclient.connect();
  var ticketclient = dataBase.collection('ticket');
  var ordersclient = dataBase.collection('orders');
  var fticket = await ticketclient.findOne({ orderId: req.body.orderId, status: "open" });
  if (fticket == null) {
    var order = await ordersclient.findOne({ orderId: req.body.orderId });
    if (order == null) {
      res.json({ message: "No orders found" });
    } else {
      var object = {};
      console.log("order info-----", order);
      object.vendorId = order.data.vendor_info.id;
      object.userId = order.userId;
      object.orderId = order.orderId;
      object.ticketId = uuidv4();
      object.status = "open";
      object.comments = [{ commentBy: order.userId, comment: req.body.comment, type: "text", date: new Date() }];
      var ticket = await ticketclient.insertOne(object);


      res.json({
        status: true,
        message: "success",
        data: ticket.insertedId,



      });
    }
  } else {
    res.json({
      status: false,
      message: "already ticket exist",
      ticketId: fticket.ticketId



    });
  }


  //   }

});
app.get('/api/ticket/get/:ticketId', async function (req, res) {
  var ticketId = req.params.ticketId;


  console.log("data-----------", data);

  // var productclient = await mongoclient.connect('products');

  var dataBase = await mongoclient.connect();
  var ticketclient = dataBase.collection('ticket');



  var data = await ticketclient.findOne({ ticketId: ticketId });


  res.json({
    status: true,
    message: "success",
    data: data,



  });

  //   }

});
app.get('/api/ticket/getbyuserid/:userId', async function (req, res) {
  var userId = req.params.userId;


  console.log("data-----------", data);

  // var productclient = await mongoclient.connect('products');

  var dataBase = await mongoclient.connect();
  var ticketclient = dataBase.collection('ticket');



  var data = await ticketclient.find({ userId: userId }).toArray();


  res.json({
    status: true,
    message: "success",
    data: data,



  });

  //   }

});
app.get('/api/ticket/getbyorderid/:orderId', async function (req, res) {
  var orderId = req.params.orderId;


  console.log("data-----------", data);

  // var productclient = await mongoclient.connect('products');

  var dataBase = await mongoclient.connect();
  var ticketclient = dataBase.collection('ticket');



  var data = await ticketclient.findOne({ orderId: orderId });


  res.json({
    status: true,
    message: "success",
    data: data,



  });

  //   }

});
app.get('/api/ticket/getbyvendorid/:vendorId', async function (req, res) {
  var vendorId = req.params.vendorId;


  console.log("data-----------", data);

  // var productclient = await mongoclient.connect('products');

  var dataBase = await mongoclient.connect();
  var ticketclient = dataBase.collection('ticket');



  var data = await ticketclient.find({ vendorId: vendorId }).toArray();


  res.json({
    status: true,
    message: "success",
    data: data,



  });

  //   }

});
app.post('/api/ticket/comment', async function (req, res) {
  var data = req.body;


  console.log("data-----------", data);

  // var productclient = await mongoclient.connect('products');

  var dataBase = await mongoclient.connect();
  var ticketclient = dataBase.collection('ticket');
  var ordersclient = dataBase.collection('orders');

  var ticket = await ticketclient.findOne({ ticketId: req.body.ticketId, status: "open" });
  if (ticket == null) {
    res.json({ message: "no ticket found" });
  } else {
    commentObj.date=new Date();
    if (req.body.commentObj.action != "button") {
      var userdata1 = await ticketclient.findOneAndUpdate({ ticketId: req.body.ticketId, status: "open" }, { $push: { comments: req.body.commentObj } }, { upsert: true });

      res.json({
        status: true,
        message: "comment added successfully",
      });
    }
    else {
      console.log("ssssss--------",ticket);
      var userdata1 = await ticketclient.findOneAndUpdate({ ticketId: req.body.ticketId, status: "open" }, { $push: { comments: req.body.commentObj } }, { upsert: true });
      // var staus="";
      // if(req.body.button=="refund")
      // {

      // }
     // var orderupdate = await ordersclient.findOneAndUpdate({ orderId: ticket.orderId }, { $set: { status: req.body.commentObj.button } });
      res.json({
        status: true,
        message: "comment added successfully",
      });
    }
  }
    
});
app.post('/api/ticket/filecomment', async function (req, res) {
  var data = req.body;


  console.log("data-----------", data);

  // var productclient = await mongoclient.connect('products');

  var dataBase = await mongoclient.connect();
  var ticketclient = dataBase.collection('ticket');
  var ordersclient = dataBase.collection('orders');

  var ticket = await ticketclient.findOne({ ticketId: req.body.ticketId, status: "open" });
  if (ticket == null) {
    res.json({ message: "no ticket found" });
  } else {
    commentObj.date=new Date();
  
      var userdata1 = await ticketclient.findOneAndUpdate({ ticketId: req.body.ticketId, status: "open" }, { $push: { files: req.body.commentObj } }, { upsert: true });

      res.json({
        status: true,
        message: "file added successfully",
      });
   
  }
    
});
module.exports.handler = serverless(app);

//"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjdhYWY5MC0yMGVhLTExZWMtYWM3NC04OTMxZmI5YjMwNjIiLCJpYXQiOjE2NDM3NjMyNjcsImV4cCI6MTY1OTMxNTI2N30.F7PeNWPgFAVbJ682JHyzV7hahMC2CkFM76uQxUE-M7c"