const serverless = require('serverless-http');
const express = require('express')
const app = express();
const {
  v4: uuidv4
} = require('uuid');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var mongoclient = require('./mongodb');
const {
  ObjectId
} = require('mongodb');
const e = require('express');
const {
  query
} = require('express');

app.use(express.json());
app.use(cors());


var JWT_SECRET_KEY = 'dmFyZWFwcGl2b3J5aW5ub3ZhdGlvbnNoYXJpa3Jpc2huYTE3Mjk=';

app.use(function (req, res, next) {
  if (req.headers['x-user-auth'] == null) {
    return res.status(401).json({
      message: "Access Token missing"
    });
  }
  try {
    console.log("req.headers['x-user-auth']", req.headers['x-user-auth']);
    var decoded = jwt.verify(req.headers['x-user-auth'], JWT_SECRET_KEY);
    req.userId = decoded.userId;
    req.vendorId = decoded.vendorId;
    console.log("req.body----------", req.body, req.vendorId);
    next();
  } catch (err) {
    // err
    console.log("err----", err.message);
    return res.status(401).json({
      message: "Unauthorised"
    });
  }
});
app.post('/api/voucher/add', async function (req, res) {
  var data = req.body;
  console.log("data-----------", data);
  var dataBase = await mongoclient.connect();
  var vouchersclient = await dataBase.collection('vouchers');
  if (data.id == null) {
    req.body.createby = req.userId;
    req.body.vendorId = req.vendorId;
    req.body.createDate = new Date();
    req.body.exdate = new Date(req.body.exdate);
    req.body.isActive = true;
    req.body.usedtimes = req.body.noofpersonsbuy;
    var voucher = await vouchersclient.insert(req.body);
    return res.json({
      "status": true,
      message: "inserted"
    });
  } else {
    var id = ObjectId(data.id);
    delete data.id;
    var voucher = await vouchersclient.findOneAndUpdate({
      _id: id
    }, {
      $set: req.body
    });
    return res.json({
      "status": true,
      message: "updated"
    });
  }








});

app.get('/api/voucher/vendor', async function (req, res) {
  var data = req.body;
  console.log("data-----------", data);
  var dataBase = await mongoclient.connect();
  var vouchersclient = await dataBase.collection('vouchers');
  console.log("ssssss-------", req.vendorId);
  var vouchers = await vouchersclient.find({
    "vendorId": req.vendorId
  }).toArray();


  res.json({
    "status": true,
    data: vouchers
  });




});
app.get('/api/voucher/active', async function (req, res) {
  var data = req.body;
  console.log("data-----------", data);
  var dataBase = await mongoclient.connect();
  var vouchersclient = await dataBase.collection('vouchers');
  var user_vouchersclient = await dataBase.collection('user_vouchers');
  var voucherids = await user_vouchersclient.find({
    userId: req.userId
  }, {
    projection: {
      "voucherId": 1,
      _id: 0
    }
  }).toArray();
  console.log("voucherids", voucherids);
  var ids = [];
  voucherids.forEach((e) => {
    ids.push(ObjectId(e.voucherId));
  });
  var todate = new Date();
  todate.setHours(0, 0, 0, 0);
  console.log("ccc-----", todate);
  var query = {
    "isActive": true,
    exdate: {
      $gte: todate
    },
    usedtimes: {
      $gt: 0
    },"_id": {
      $nin: ids
    }
  };
  console.log("query...........",query);
    var vouchers = await vouchersclient.find(query).toArray();

  console.log("v--------", vouchers);
  res.json({
    "status": true,
    data: vouchers
  });




});
app.get('/api/voucher/user', async function (req, res) {
  var data = req.body;
  console.log("data-----------", data);
  var dataBase = await mongoclient.connect();
  var user_vouchersclient = await dataBase.collection('user_vouchers');

  var vouchers = await user_vouchersclient.find({
    "userId": req.userId,
    isUsed: false
  }).toArray();


  res.json({
    "status": true,
    data: vouchers
  });




});
app.post('/api/voucher/userbyvendorid', async function (req, res) {
  var data = req.body;
  console.log("data-----------", data);
  var dataBase = await mongoclient.connect();
  //getproducts
  var productclient = await dataBase.collection('products');
  var query = {};
  if (data.ids != undefined && data.ids.length > 0) {
    query.productId = {
      $in: data.ids
    };
  } else {
    res.json({
      status: false,
      message: "No products found",
    });
    return;
  }
  console.log("query------------", query);
  const products = await productclient.find(query, {
    $project: {
      "vendorId": 1,
      "_id": 0
    }
  }).limit(5).sort({
    _id: -1
  }).toArray();
  console.log("productslist---------------", products);



  if (products.length <= 0) {

    res.json({
      status: false,
      message: "No products found",
    });


  } else {
    console.log("productlist---------------", products);
    var proids = [];
    products.forEach((e) => {
      proids.push(e.vendorId);
    });
    var user_vouchersclient = await dataBase.collection('user_vouchers');

    var vouchers = await user_vouchersclient.find({
      "vendorId": {
        $in: proids
      },
      userId: req.userId,
      isUsed: false
    }).toArray();

  }




  res.json({
    "status": true,
    data: vouchers
  });




});
app.post('/api/voucher/user_redeem', async function (req, res) {
  var data = req.body;
  console.log("data-----------", data);
  var dataBase = await mongoclient.connect();
  var user_vouchersclient = await dataBase.collection('user_vouchers');
  var vouchersclient = await dataBase.collection('vouchers');
  var userclient = await dataBase.collection('user');
  var user_reward_pointsclient = await dataBase.collection('user_reward_points');
  var vendor_reward_pointsclient = await dataBase.collection('vendor_reward_points');
  var vid = data.voucher._id;
  var voucher = await vouchersclient.findOne({
    "_id": ObjectId(vid)
  });
  if (voucher.usedtimes > 0) {
    var user_voucher = data.voucher;
    user_voucher.userId = req.userId;
    user_voucher.isUsed = false;
    user_voucher.voucherId = user_voucher._id;
    var vid = data.voucher._id;
    req.body.createDate = new Date();
    delete user_voucher._id;
    var user_vouchers = await user_vouchersclient.insert(user_voucher);
    const update = await userclient.findOneAndUpdate({
      "user_id": req.userId
    }, {
      $inc: {
        "points": -(req.body.usedpoints)
      }
    }, );
    const update1 = await userclient.findOneAndUpdate({
      "vendorId": data.voucher.vendorId
    }, {
      $inc: {
        "points": req.body.usedpoints
      }
    }, );
    var customerrewardtrn = {
      "userId": req.userId,
      "points": req.body.usedpoints,
      "type": "Dr",
      "date": new Date(),
      "tran_category": "voucher",
    };
    var vendorrewardtrn = {
      "vendorId": data.voucher.vendorId,
      "points": req.body.usedpoints,
      "type": "Cr",
      "date": new Date(),
      "tran_category": "voucher",
      "tag": ""
    };
    await user_reward_pointsclient.insertOne(customerrewardtrn);
    await vendor_reward_pointsclient.insertOne(vendorrewardtrn);
    var voucherup = await vouchersclient.findOneAndUpdate({
      _id: ObjectId(vid)
    }, {
      $inc: {
        usedtimes: -1
      }
    });
    //{"_id":{"$oid":"61a9c3cd7de419f06dd360f6"},"orderId":"b09c8b84-cb3a-4295-abda-3538edb63fc2","userId":"a60e4620-535d-11ec-b0f5-ef446a330f66","points":{"$numberInt":"71"},"type":"Cr","date":{"$date":{"$numberLong":"1638515661555"}},"reward_from":"shareapp","tag":""}

    res.json({
      "status": true
    });

  } else {
    res.json({
      "status": false,
      message: "Max redeems completed on this voucher"
    });
  }


});

module.exports.handler = serverless(app);