const serverless = require('serverless-http');
const express = require('express')
const rewards= require('./modules/rewards');
const app = express();
const {
    v4: uuidv4
} = require('uuid');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var mongoclient = require('./mongodb');
var Razorpay = require("razorpay");
var AWS = require('aws-sdk');
// Set region
AWS.config.update({
    region: 'ap-south-1',
    accessKeyId: 'AKIAVOLZKSLW32Y3AVRL',
    secretAccessKey: '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'
});

app.use(express.json());
app.use(cors());

// mongo db connection 
var MONGO_DB_CONNECTION = process.env.MONGO_DB_CONNECTION || 'mongodb+srv://sowmya:iNNrxOhVfEdvsUaI@vare.cnw2n.mongodb.net/vare?retryWrites=true&w=majority';
console.log('MONGO_DB_CONNECTION', MONGO_DB_CONNECTION);
var Agent = require('sqlagent/mongodb').connect(MONGO_DB_CONNECTION);

const instance = new Razorpay({
    key_id: "rzp_test_W5ZLYSpnYqq2J3",
    key_secret: "uMdOz5EWOV1sqP99x6QoZG9M",
});

var JWT_SECRET_KEY = 'dmFyZWFwcGl2b3J5aW5ub3ZhdGlvbnNoYXJpa3Jpc2huYTE3Mjk=';
app.get('/api/rewards/testreward', testreward);
async function testreward(req,res){
    //await rewards.generateAndSendRewards("1a248c80-213c-11ec-bf2a-a1a2c1703ba1","b09c8b84-cb3a-4295-abda-3538edb63fc2");
    await rewards.venderRewards("d36ced20-1db5-11ec-afb0-c3c93c78e8f3","welcome");
    
    res.json({"status":true});
    }


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
        console.log("req.body----------", req.body);
        next();
    } catch (err) {
        // err
        console.log("err----", err.message);
        return res.status(401).json({
            message: "Unauthorised"
        });
    }
});

app.get('/api/rewards/user', getUserRewards);
app.get('/api/rewards/vendor', getVendorRewards);


async function getUserRewards(req, res) {
    console.log("rewards-------");
   
    var dataBase = await mongoclient.connect();

    var user_reward_pointsclient = await dataBase.collection('user_reward_points');

    console.log("userId---------------", req.userId);
    var response = await user_reward_pointsclient.find({
        "userId": req.userId
    }).sort({
        created: -1
    }).toArray();
    console.log("tttttttttttt", response);
    res.json({
        status: true,
        data: response
    });
}

async function getVendorRewards(req, res) {
    console.log("rewards-------");
   
    var dataBase = await mongoclient.connect();

    var vendor_reward_pointsclient = await dataBase.collection('vendor_reward_points');

    console.log("userId---------------", req.userId);
    var response = await vendor_reward_pointsclient.find({
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