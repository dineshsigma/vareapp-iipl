const serverless = require('serverless-http');
const express = require('express')
const app = express();
const {
    v4: uuidv4
} = require('uuid');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var mongoclient = require('./mongodb');



app.use(express.json());
app.use(cors());



    

async function informetoVendor(){
    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');

   
    var response = await orderclient.find({
        "status":"orderplaced",'awdtime': {$lte: new Date().getTime()}
    }).toArray();
    if(response.length>0)
    {
    console.log("tttttttttttt", response[0].orderId);
    //send awd to vendor
    var awd=response[0].awdtime+ (8*60*60*1000)
    var response = await orderclient.updateOne({
        
        "orderId": response[0].orderId
    }, {
        $set: {
            "flag": response[0].flag==undefined?8:response[0].flag+8,
            "awdtime":awd
        }
    });
    }else{
        console.log("cool.......");
    }
   
}



async function informeShippedtoVendor(){
    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');

   
    var response = await orderclient.find({
        "status":"processing",'awdtime': {$lte: new Date().getTime()}
    }).toArray();
    if(response.length>0)
    {
    console.log("tttttttttttt", response[0].orderId);
    //send awd to vendor
    var awd=response[0].awdtime+ (8*60*60*1000)
    var response = await orderclient.updateOne({
        
        "orderId": response[0].orderId
    }, {
        $set: {
            "flag": response[0].flag==undefined?8:response[0].flag+8,
            "awdtime":awd
        }
    });
    }else{
        console.log("cool.......");
    }
   
}
//informetoVendor();
informeShippedtoVendor();