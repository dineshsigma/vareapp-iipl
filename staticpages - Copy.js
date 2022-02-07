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


app.get('/api/staticpages', async function (req, res) {
  var data = req.query.pageName;

  
    console.log("data-----------",data);
   
  // var productclient = await mongoclient.connect('products');
  
   var dataBase = await mongoclient.connect();
   var configurationclient=dataBase.collection('configuration');
 

       
       var data= await configurationclient.findOne({"name":data});
    
       
                     res.json({                        status: true,
                        message: "success",
                          data:data.data,
                         
                     
                        
                    });
        
             //   }
    
});


module.exports.handler = serverless(app);