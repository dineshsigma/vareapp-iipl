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

var bodyParser = require('body-parser');
const { stringify } = require('querystring');
app.get('/api/messages',  async function (req, res) {
  console.log("fhcs dbhv dhv ")
  var data = req.userId;

  
    console.log("data-----------",data);
   
   
  // var productclient = await mongoclient.connect('products');
  
   var dataBase = await mongoclient.connect();
   var messagesclient=dataBase.collection('messages');
      var messagesreadclient=dataBase.collection('messagesread');
 

       
       var data= await messagesclient.find().toArray();
       var finaldata=[];
       for (const element of data) {
   
      var data1= await messagesreadclient.findOne({messageId:element.messageId,userId:req.userId});
      if(data1!=null)
      {
        element.isRead=true;
      }else{
        element.isRead=false;
      }
      finaldata.push(element);
    }
       
                     res.json({                        status: true,
                        message: "success",
                          data:finaldata,
                         
                     
                        
                    });
        
             //   }
    
});

app.post('/api/messages/read', async function (req, res) {
  var data = req.body;

  
    console.log("data-----------",data);
   
  // var productclient = await mongoclient.connect('products');
  
   var dataBase = await mongoclient.connect();
   var messagesreadclient=dataBase.collection('messagesread');
 

       
       var messagesread= await messagesreadclient.findOne({messageId:data.messageId,userId:req.userId,isRead:true});
       if(messagesread==null)
       {
       var data1= await messagesreadclient.insertOne({messageId:data.messageId,userId:req.userId,isRead:true});
       res.json({                        status: true,
        message: "success",
   
         
     
        
    });

       }else{
        res.json({                        status: false,
          message: "Aleardy readed",
           
       
          
      });
       }

       
                     
             //   }
    
});


//-------------------------get all messages----------------------------
app.get('/api/messages/dinesh',async (req,res)=>{
 

  let database=await mongoclient.connect();
  let message=database.collection('parent');
  let output=await message.find().toArray();
  res.status(200).send(output);

})
//----------------------------------get messages by id with params -----------------------------------//
app.get('/api/messages/dinesh/:id',async (req,res)=>{
  console.log(req.params.id);
  let database=await mongoclient.connect();
  let message=database.collection('messages');
  //let output=await message.findOne({"_id":ObjectId(req.params.id)})
  let output= await message.findOne({"_id":ObjectId(req.params.id)})
  res.status(200).send(output);
})
//------------------------------update by id with params---------------------------------//
app.put('/api/messages/dinesh/:id',async (req,res)=>{
  let database=await mongoclient.connect();
  let message=database.collection('messages');
  let response= await message.findOneAndUpdate({"_id":ObjectId(req.params.id)},{$set:{"sendto":req.body.sendto}});
  res.status(200).send(response);
})

//------------------------get by id with post request---------------------------------------//
app.post('/api/messages/req',async (req,res)=>{
  console.log("req.body"+req.id);

  let database=await mongoclient.connect();
  let post=database.collection('messages');
  let response=await post.findOne({"id":req.id});
  res.status(200).send(response);
  })

  //--------------------------insert messages table--------------------------------------//

  app.post('/api/messages/insert/dinesh',async (req,res)=>{
    console.log(req.body);
    let database= await mongoclient.connect();
    let insertmessage=database.collection('messages');
    let response= await insertmessage.insertOne(req.body);
    res.status(200).send(response);
  })

  //---------------------------------delete message table by id--------------------------------//


  app.delete('/api/messages/delete/:id',async (req,res)=>{
    let id=req.params.id
    let database=await mongoclient.connect();
    let deletemessage=database.collection('messages');
    let response= await deletemessage.deleteOne({id:id});
    res.status(200).send(response)
    })


    app.get('/api/messages/query',async (req,res)=>{
      let database=await mongoclient.connect();
      
      
      let createtable=database.collection('dinesh');
      let response=await createtable.find().toArray();
      res.status(200).send(response);
      
     
    })


    app.post('/api/messages/create',async (req,res)=>{
      let database= await mongoclient.connect();
      let create=database.collection('grades');
      let response=await create.insertOne(req.body);
      res.status(200).send(response);
    })

   
    app.get('/api/messages/join',async (req,res)=>{
      let database= await mongoclient.connect();
      let movies=database.collection('students');
      let response=await movies.aggregate
      (
        [
          {
        $group:{
          _id:"$name",
          count: { $sum: 1 },
         
         
         
         
         
        }
        
        
        
      },
    ]
    
    )
    .toArray();
      console.log(response);
     
      res.status(200).send(response);


      //let password='dinesh'
      /*let hashpassword=hashSync(password,10);
      console.log("-----------------------------------------"+hashpassword);*/
      //ascending order indicitaes 1
      //descending order indicates -1
      //limit : how many records   have to fetch limit size

      /*let sort={sci:-1};
      let response=await movies.find().sort(sort).limit(2).toArray();
      res.status(200).send(response);
      /*const estimate = await movies.estimatedDocumentCount();
    console.log(`Estimated number of documents in the movies collection: ${estimate}`);
    const query = { name: "dinesh" };
    // Find the number of documents that match the specified
    // query, (i.e. with "Canada" as a value in the "countries" field)
    // and print out the count.
    const countCanada = await movies.countDocuments(query);
    console.log(`Number of movies from Canada: ${countCanada}`);*/
     

      
     // let response= await dinesh.aggregate([{$match:{age:{$gt:'25'}}}]).pretty();
     //let response= await dinesh.count();

     
      

    })


///---------------------------------upload images--------------------------------------------///
let upload=require('./upload');
const Grid = require("gridfs-stream");
const mongoose = require("mongoose");
const conn = mongoose.connection;
conn.once("open", function () {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("image");
});


app.post('/api/messages/images',upload.single('image'),async (req,res)=>{
  console.log(req.file.filename+"-------------------------------------------------------");
  const imgUrl = `http://localhost:3000/dev/api/messages/file/${req.file.filename}`;
  console.log(imgUrl);
  res.status(200).send(imgUrl);
})

app.get("/api/messages/file/:filename", async (req, res) => {
  try {
      const file = await gfs.files.findOne({ filename: req.params.filename });
      const readStream = gfs.createReadStream(file.filename);
      readStream.pipe(res);
  } catch (error) {
      res.send("not found");
  }
});

var nodemailer=require('nodemailer');
app.post('/api/messages/sendmail',async (req,res)=>{

  
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dinesh.abcdj@gmail.com',
    pass: 'Dinesh@432'
  }
});

var mailOptions = {
  from: 'dinesh.abcdj@gmail.com',
  to: 'dinesh.abcdj@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
    res.status(200).send(info.response)
  }
});

})

//-------------------------------create orders table-------------------------------------//


app.post('/api/messages/createorders',async (req,res)=>{
  try{
  let database=await mongoclient.connect();
  let create=database.createCollection('parenttable');
  res.status(200).send(create)
  }
  catch(error){
    res.status(400).send(error);
  }

})
//-----------------insert parent table-------------------------------------------------//

app.post('/api/messages/childtable',async (req,res)=>{
  try{
    let database=await mongoclient.connect();
    let parenttable=database.collection('childtable');
    let response=await parenttable.insertOne(req.body);
    res.status(200).send(response);

  }
  catch(error){
    res.status(200).send(error);
  }
})

//------------------------parent and child relation------------------------------------//

app.get('/api/messages/relation',async (req,res)=>{
  try{
    let database= await mongoclient.connect();
    let relation=database.collection('childtable').aggregate([{
      $lookup:{
        from:'parenttable',
        localField:'product_id',
        foreignField:'id',
        as:'orderdetails'
      }
    }]).toArray();
    console.log("-----------------------------------------------dinessh---------"+relation)
    res.status(200).send(relation);

  }
  catch(error){
    res.status(200).send(error);
  }
})



//alter query
app.post('/api/messages/alter',async (req,res)=>{
  try{
      let database=await mongoclient.connect();
      let addcolumn=database.collection('parenttable');
      let response=await addcolumn.update({},{$unset:{price:""}},{multi:true});
      res.status(200).send(response);

      

  }
  catch(error){
      console.log(error);
      res.status(400).send(error);
  }
})

//--------------rename table name----------------//
app.post('/api/messages/rename',async (req,res)=>{
  try{
    let database=await mongoclient.connect();
    let coll=database.collection('parenttable');
    let rename=await coll.rename('parent');
    res.status(200).send({message:"table is renamed"});

  }
  catch(error){
    res.status(400).send(error);
  }
})



let structure=require('./schema.js');
app.post('/api/messages/schema',async (req,res)=>{
  try{
    let database= await mongoclient.connect();
    let s=database.createCollection('IIPL',structure);
    let response=await s.create({name:req.body.name,marks:req.body.marks})
    res.status(200).send(response);

  }
  catch(error){
    res.status(400).send(error);
  }
})

app.post('/api/messages/changedatatype',async (req,res)=>{
  try{
    let database= await mongoclient.connect();
    let rename=database.collection('parent');
    let response=rename.update({"id":{"$type":"string"}},{"$set":{"id":{"$type":Number}}});
    res.status(200).send(response);

  }
  catch(error){
    res.status(400).send(error);
  }
})
module.exports.handler = serverless(app);