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
  console.log("nbcshjdcd")
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


app.post('/api/blog', async function (req, res) {
  var data = req.body;

  var pageNo = parseInt(req.query.pageNo)
  var size = 10;
  var query = {}
  if(pageNo < 0 || pageNo === 0) {
        response = {"error" : true,"message" : "invalid page number, should start with 1"};
        return res.json(response)
  }
  var skip = size * (pageNo - 1)
  var limit = size
  // Find some documents
    var dataBase = await mongoclient.connect();
   var blogclient = await dataBase.collection('blog');
   if(data.tags!=undefined && data.tags.length>0)
  {
    query.tags={ $in: data.tags };
  }
  console.log("query----",query);
 var totalcount=await  blogclient.count(query);
 console.log("totalcount----",totalcount);
             if(totalcount==0) {
               response = {"status" : false,"message" : "No  data found"}
             }else{
            var blogs=  await blogclient.find(query).limit(limit).skip(skip).sort({_id:-1}).toArray();
             
          
            if(blogs.length<=0) {
                response = {"status" : false,"message" : "  data not found"};
            } else {
                var totalPages = Math.ceil(totalcount / size)
                response = {"status" : true,"data" : blogs,"pages": totalPages};
            }
          }
            res.json(response);
     
  
});
app.get('/api/blog/:id', async function (req, res) {
    var data = req.params;
    console.log("data-----------",data);
   
  // var productclient = await mongoclient.connect('products');
  
   var dataBase = await mongoclient.connect();
   var blogclient=dataBase.collection('blog');
 

       
       var blog= await blogclient.findOne({"_id":ObjectId(req.params.id)});
    
       
                     res.json({                        status: true,
                        message: "success",
                          data:blog,
                         
                     
                        
                    });
        
             //   }
    
});
app.post('/api/blog/latestblogs', async function (req, res) {
  var dataBase = await mongoclient.connect();
  var blogclient = await dataBase.collection('blog');
            var blogs=  await blogclient.find({}).limit(3).sort({_id:-1}).toArray();
             
          
            if(blogs.length<=0) {
                response = {"status" : false,"message" : "  data not found"};
            } else {
               
                response = {"status" : true,"data" : blogs};
            }
           res.json(response);
     });
     app.post('/api/blog/tags', async function (req, res) {
      var dataBase = await mongoclient.connect();
      var blog_tagsclient = await dataBase.collection('blog_tags');
      var blog_tags=  await blog_tagsclient.find({}).sort({_id:-1}).toArray();
       
    
      if(blog_tags.length<=0) {
          response = {"status" : false,"message" : "  data not found"};
      } else {
         
          response = {"status" : true,"data" : blog_tags};
      }
     res.json(response);
});
module.exports.handler = serverless(app);