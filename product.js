const serverless = require('serverless-http');
const express = require('express')
const app = express();
const { v4: uuidv4 } = require('uuid');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var mongoclient = require('./mongodb');
const e = require('express');
const { ObjectId } = require('mongodb');
app.use(express.json());
app.use(cors());

// mongo db connection 
var MONGO_DB_CONNECTION = process.env.MONGO_DB_CONNECTION || 'mongodb+srv://sowmya:iNNrxOhVfEdvsUaI@vare.cnw2n.mongodb.net/vare?retryWrites=true&w=majority';
console.log('MONGO_DB_CONNECTION', MONGO_DB_CONNECTION);
var Agent = require('sqlagent/mongodb').connect(MONGO_DB_CONNECTION);
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
app.post('/api/product/basedonidslist/get',basedonidslist);
app.post('/api/product/categories', async function (req, res) {
    var data = req.body;
    console.log("data-----------",data);
    var dataBase = await mongoclient.connect();
   var categoryclient = await dataBase.collection('category');
  
   const categorylist = await categoryclient.find(req.body).toArray();
   

   
    if (categorylist.length<=0) {

     res.json({
            status: false,
            message: "No category found",
        });


    } else {
        console.log("categorylist---------------",categorylist);
                     res.json({
                        status: true,
                        message: "success",
                        data: categorylist
                    });
        
                }
    
});
// app.get('/api/product/categories/levelwise', async function (req, res) {
//   //level 1
//   var categorylist=[];
//   var data = req.body;
//   console.log("data-----------",data);
//   var dataBase = await mongoclient.connect();
//  var categoryclient = await dataBase.collection('category');

//  const categorylist = await categoryclient.find(req.body).toArray();
 
// if(req.params.level==1)
// {

// }
// var getCategory = await catClient.collection.findOne({ "id": req.params.id });
// console.log("getCategory", getCategory)
// if(getCategory != null && getCategory.level != undefined || getCategory.level != null || getCategory.level == 1) {
//  //  level 2
//  var subCatClient = await mongoclient.connect('category');
//  var getSubCategoryl2 = await subCatClient.collection.find({ "parent_id": req.params.id }).toArray();
//  console.log("getSubCategoryl2", getSubCategoryl2)
//  if (getSubCategoryl2.length > 0) {
//      categorylist.push(...getSubCategoryl2);
//   // getCategory.sub_categories_l2 = getSubCategoryl2;
//    // level 3

//    for (let i = 0; i < getSubCategoryl2.length; i++) {
//      const subCat = getSubCategoryl2[i];
//      var subCatClientl3 = await mongoclient.connect('category');
//      var getSubCategoryl3 = await subCatClientl3.collection.find({ "parent_id": subCat.id }).toArray();
//      console.log("getSubCategoryl3", getSubCategoryl3);
//     // subCat.sub_categories_l3 = [];
//      if (getSubCategoryl3.length > 0) {
//       // subCat.sub_categories_l3.push(getSubCategoryl3);
//        categorylist.push(...getSubCategoryl3);
//      } else {
//       // subCat.sub_categories_l3 = [];
//      }
//    }
//    console.log("getSubCategoryl4-------", categorylist);

//    res.json({ status: true, data: categorylist })
//  } else {
//    getCategory.sub_categories_l2 = [];
//  }
// } else {
//  res.json({
//    status: false,
//    message: "Data Not found"
//  })
// }

// });
//not in use
app.get('/api/product/allsubcategories/:id', async function (req, res) {
     //level 1
     var categorylist=[];
  var catClient = await mongoclient.connect()('category');
  var getCategory = await catClient.collection.findOne({ "id": req.params.id });
  console.log("getCategory", getCategory)
  if(getCategory != null && getCategory.level != undefined || getCategory.level != null || getCategory.level == 1) {
    //  level 2
    var subCatClient = await mongoclient.connect('category');
    var getSubCategoryl2 = await subCatClient.collection.find({ "parent_id": req.params.id }).toArray();
    console.log("getSubCategoryl2", getSubCategoryl2)
    if (getSubCategoryl2.length > 0) {
        categorylist.push(...getSubCategoryl2);
     // getCategory.sub_categories_l2 = getSubCategoryl2;
      // level 3

      for (let i = 0; i < getSubCategoryl2.length; i++) {
        const subCat = getSubCategoryl2[i];
        var subCatClientl3 = await mongoclient.connect('category');
        var getSubCategoryl3 = await subCatClientl3.collection.find({ "parent_id": subCat.id }).toArray();
        console.log("getSubCategoryl3", getSubCategoryl3);
       // subCat.sub_categories_l3 = [];
        if (getSubCategoryl3.length > 0) {
         // subCat.sub_categories_l3.push(getSubCategoryl3);
          categorylist.push(...getSubCategoryl3);
        } else {
         // subCat.sub_categories_l3 = [];
        }
      }
      console.log("getSubCategoryl4-------", categorylist);

      res.json({ status: true, data: categorylist })
    } else {
      getCategory.sub_categories_l2 = [];
    }
  } else {
    res.json({
      status: false,
      message: "Data Not found"
    })
  }

});

app.post('/api/product', async function (req, res) {
  var data = req.body;

  var pageNo = parseInt(req.query.pageNo);
  var size = 10;
  if(req.query.mskip!=null)
  {
  var mskip=parseInt(req.query.mskip);
  size=mskip;
  }
  var dataBase = await mongoclient.connect();
  var productclient = await dataBase.collection('products');
  var promotionclient = await dataBase.collection('promotion');
  //promotion
  var promotiondata;
  if(data.category!=undefined && data.category.length>0)
  {
    var today=new Date();
    var promodate=""+today.getFullYear()+"-"+(today.getMonth()+1)+"-"+today.getDate();
  console.log("promo date-----",promodate);
   promotiondata=await promotionclient.findOne({"category.id":data.category[0],date:promodate});
    console.log('promotiondata.....',promotiondata);
    if(promotiondata!=null)
    {
    var promoproducts=  await productclient.find({"category":{ $in: data.category },vendorId:promotiondata.vendorId}).limit(5).sort({_id:-1}).toArray();
  //console.log("promo products-----",promoproducts);
  promoproducts.forEach(element => {
    element.ispromoted=true;
  });
  console.log("promo products-----",promoproducts);
  }
  }
//promotion end



  var query = {}
  if(pageNo < 0 || pageNo === 0) {
        response = {"error" : true,"message" : "invalid page number, should start with 1"};
        return res.json(response)
  }
  var skip = size * (pageNo - 1)
  var limit = size
  // Find some documents
   
   if(data.category!=undefined && data.category.length>0)
  {
    query.category={ $in: data.category };
  }
  if(data.serach!=undefined && data.serach!="")
  {
    query.name= { $regex: data.serach, $options: 'i',  };
  }
  console.log("query----",query);
 var totalcount=await  productclient.count(query);
 console.log("totalcount----",totalcount);
             if(totalcount==0) {
               response = {"status" : false,"message" : "No  data found"}
             }else{
            var products=  await productclient.find(query).limit(limit).skip(skip).sort({_id:-1}).toArray();
             
          
            if(products.length<=0) {
                response = {"status" : false,"message" : "  data not found"};
            } else {
                var totalPages = Math.ceil(totalcount / size)
                let totalproducts;
                if(promoproducts!=undefined)
                 totalproducts =[...promoproducts,...products];
                else{
                   totalproducts=products;
                }

                response = {"status" : true,"data" : totalproducts,"pages": totalPages};
            }
          }
            res.json(response);
     
  //   var data = req.body;
  //   console.log("data-----------",data);
  //   var dataBase = await mongoclient.connect();
  //  var productclient = await dataBase.collection('products');
  //  var query={};
  // if(data.category!=undefined && data.category.length>0)
  // {
  //   query.category={ $in: data.category };
  // }
  // console.log("query------------",query);
  //  const products = await productclient.find(query).limit(req.body.limit).skip(req.body.skip).sort({_id:-1}).toArray();
  //  console.log("productslist---------------",products);


   
  //   if (products.length<=0) {

  //    res.json({
  //           status: false,
  //           message: "No products found",
  //       });


  //   } else {
  //       console.log("categorylist---------------",products);
  //                    res.json({
  //                       status: true,
  //                       message: "success",
  //                       data: products
  //                   });
        
  //               }
  });
app.get('/api/product/:id', async function (req, res) {
    var data = req.params;
    console.log("data-----------",data);
   
  
   var dataBase = await mongoclient.connect();
   var cartclient=dataBase.collection('cart');
   var productclient = await dataBase.collection('products');

   var wishclient = await dataBase.collection('wishlist');
   var query={};
  if(data.id!=undefined)
  {
    query={"productId": data.id };
  }
  console.log("query------------",query);
   const product = await productclient.findOne(query);
   console.log("product---------------",product);


   
    if (product==null) {

     res.json({
            status: false,
            message: "No products found",
        });


    } else {


        console.log("product---------------",req.userId);
       var cart= await cartclient.findOne({"userId":req.userId,"items.productId":data.id}, { projection: {'filteredValue': {
        $filter: {
          input: "$items",
          as: "someObj",
          cond: { $eq: [ '$$someObj.productId', data.id] }
        }
    },"_id":0}});
      var wish=await wishclient.findOne({"user_id":req.userId,"product_id":{$in:[data.id]}},);
       console.log("cartwish-------------",cart,wish);
       
                     res.json({                        status: true,
                        message: "success",
                          data:{"cart":cart!=null?cart.filteredValue[0].quantity:0,
                          wish:wish==null?false:true,
                          product:product
                     }
                        
                    });
        
                }
    
});
app.post('/api/product/wish', async function (req, res) {
    var data = req.body;
    console.log("data-----------",data);
   
    var dataBase = await mongoclient.connect();
   var wishclient = await dataBase.collection('wishlist');

        console.log("product---------------",req.userId);
      var wish=await wishclient.findOne({"user_id":req.userId,"product_id":{$in:[data.productId]}},);
      var wiah1;
      console.log("wish---------",wish);
      if(data.isadd && wish)
      {
        res.json({ 
                                   status: true,
            message: "success",
        
        });
        return ;
      }else if(data.isadd){
        var wish0=await wishclient.findOne({"user_id":req.userId});
        console.log("wish0---------",wish0);
        if(wish0==null)
        {
          wish1=await wishclient.insertOne({"user_id":req.userId,"product_id":[data.productId]});
          console.log("bbuuuuuuuuuuuu---------",wish1);
          res.json({                        status: true,
             message: "success",
           
         
         });
        }else{
          wish1=await wishclient.updateOne({"user_id":req.userId},{$push:{"product_id":data.productId}});
          console.log("bbuuuuuuuuuuuu---------",wish1);
          res.json({                        status: true,
             message: "success",
           
         
         });
        }
        
      }else{

         wish1=await wishclient.update({"user_id":req.userId},{ $pull: { "product_id": data.productId } });
         res.json({                        status: true,
            message: "success",
          
        
        });
      }
     //  console.log("cartwish-------------",cart,wish);
                   
        
             //   }
    
});
app.get('/api/product/wish/get', async function (req, res) {
    var data = req.body;
    console.log("data-----------",data);
   
    var dataBase = await mongoclient.connect();
   var wishclient = await dataBase.collection('wishlist');

        console.log("product---------------",req.userId);
      var wish=await wishclient.findOne({"user_id":req.userId});
      console.log(wish);
    
      if(wish!=null && wish.product_id.length>0)
      {
          req.body={"ids":wish.product_id};
          await basedonidslist(req,res);
      }else{
        res.json({ 
            status: true,
            message: "No WishList",
          
        
        });
      }
        
      });

async function basedonidslist(req, res) {
        var data = req.body;
        console.log("data-----------",data);
       
       
        var dataBase = await mongoclient.connect();
       var productclient = await dataBase.collection('products');
       var query={};
      if(data.ids!=undefined && data.ids.length>0)
      {
        query.productId={ $in: data.ids };
      }else{
        res.json({
            status: false,
            message: "No products found",
        });
        return ;
      }
      console.log("query------------",query);
       const products = await productclient.find(query).limit(5).sort({_id:-1}).toArray();
       console.log("productslist---------------",products);
    
    
       
        if (products.length<=0) {
    
         res.json({
                status: false,
                message: "No products found",
            });
    
    
        } else {
            console.log("productlist---------------",products);
                         res.json({
                            status: true,
                            message: "success",
                            data: products
                        });
            
                    }
          }
app.post('/api/product/vendor', async function (req, res) {
    var data = req.body;
    console.log("data-----------",data);
    var dataBase = await mongoclient.connect();
   var productclient = await dataBase.collection('products');
   var userclient = await dataBase.collection('user');
   const userobject = await userclient.findOne({"user_id":req.userId});

   var query={"vendorId":userobject.vendorId};
//   if(data.category!=undefined)
//   {
//     query.category={ $in: data.category };
//   }
  console.log("query------------",query);
   const products = await productclient.find(query).limit(req.body.limit).skip(req.body.skip).sort({_id:-1}).toArray();
   console.log("productslist---------------",products);


   
    if (products.length<=0) {

     res.json({
            status: false,
            message: "No products found",
        });


    } else {
        console.log("categorylist---------------",products);
                     res.json({
                        status: true,
                        message: "success",
                        data: products
                    });
        
                }
    
});

//not in use
app.post('/api/product/test', async function (req, res) {
    var data = req.body;
    
   var nosql = new Agent();

    if (data.productId != null) {
       //product check
       nosql.select('product', 'product').make(function (builder) {
        builder.where('productId', data.productId);
        builder.li
        //builder.first();
    });

    var product = await nosql.promise('product');
    if (prodcut == null) {

        return res.json({
            status: false,
            message: "No Prodcut found",
        });


    } else {
        console.log("prodcuttttttttt",product);
                    return res.json({
                        status: true,
                        message: "success",
                        data: product
                    });
        
                }
    } else {
        return res.json({
            status: false,
            message: "please provide product id",
        });

    }
})
app.post('/api/product/releated', async function (req, res) {
  var data=req.body;
  var query={};
  var dataBase = await mongoclient.connect();
  var productclient = await dataBase.collection('products');
  if(data.category!=undefined && data.category.length>0)
  {
    query.category={ $in: data.category };
  }
  var products=  await productclient.find(query).limit(3).sort({_id:-1}).toArray();
   

  if(products.length<=0) {
      response = {"status" : false,"message" : "  data not found"};
  } else {
     
      response = {"status" : true,"data" : products};
  }
 res.json(response);
});
app.post('/api/product/create', async function (req, res) {
  var data = req.body;
  console.log("data-----------",data);
 
  var dataBase = await mongoclient.connect();
  var productclient = await dataBase.collection('products');

  var product;
   if(data["_id"]==null)
     product=await productclient.insertOne(data);
else{
  
  var _id=data._id;
  delete data._id;
   product=await productclient.findOneAndUpdate({"_id":ObjectId(_id)},{$set:data});
}
    
    console.log("bbbbbb---------",product);
   
    
      res.json({ 
                                 status: true,
          message: "success",
      
      });
     
  
   //  console.log("cartwish-------------",cart,wish);
                 
      
           //   }
  
});
module.exports.handler = serverless(app);