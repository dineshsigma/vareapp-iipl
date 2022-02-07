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
app.post('/api/order/', createOrder);
app.post('/api/order/paymentOrderCreate', paymentOrderCreate);
app.get('/api/order', getOrders);
app.get('/api/order/:orderId', getOrderbyId);
app.get('/api/order/vendorById/:orderId', getVendorOrderbyId);

app.get('/api/order/vendor/get', getVendorOrders);
app.get('/api/order/group/count', getVendorOrdersCount);
app.post('/api/order/group/userordercount',getUserVendorOrdersCount);
app.put('/api/order/status', updateOrderStatus);




async function paymentOrderCreate(req, res) {
    console.log(req.body);
    console.log("nhjfvbhsdvbf")

    if (req.userId != null) {
        var dataBase = await mongoclient.connect();

        var cartclient = await dataBase.collection('cart');

        console.log("product---------------", req.userId);
        var response = await cartclient.findOne({
            "userId": req.userId
        });
        //console.log("response", response)
        if (response == null) {
            res.json({
                status: false,
                message: "Your cart is empty"
            })
        } else {
            console.log("responce---------", response);
            await instance.orders
                .create({
                    amount: response.caliculatedCart.total * 100,
                    currency: "INR",
                    receipt: response.cartId,
                    payment_capture: false,
                    notes: {},
                })
                .then(async (result) => {
                    console.log("result-----", result);
                    res.json(result);
                });

        }
    } else {
        res.json("Invalid Token");
    }

}

async function getOrders(req, res) {
    console.log("orders-------");
    // var nosql = new Agent()
    // nosql.select('orders', 'orders').make(function (builder) {
    //     builder.where('userId', req.userId);
    //     builder.sort('created',true);
    //     //builder.fields('company')
    //     //builder.first();
    // })

    // var orders = await nosql.promise('orders');
    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');

    console.log("product---------------", req.userId);
    var response = await orderclient.find({
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

async function getOrderbyId(req, res) {
    console.log("orders-------");
    // var nosql = new Agent()
    // nosql.select('orders', 'orders').make(function (builder) {
    //     builder.where('userId', req.userId);
    //     builder.where('orderId', req.params.orderId);
    //     //builder.fields('company')
    //     builder.first();
    // })

    // var orders = await nosql.promise('orders');


    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');
    var response = await orderclient.findOne({
        "userId": req.userId,
        "orderId": req.params.orderId
    });
    console.log("tttttttttttt", response);
    res.json(response);
}

async function createOrder(req, res) {
    //console.log("GET CART API CALLED ---------------------------------------------");
    var data = req.body;
    // var nosql = new Agent();


    console.log("rererererererereee----------------------", data.paymentId);


    try {

        if (req.userId != null) {
            var dataBase = await mongoclient.connect();

            var cartclient = await dataBase.collection('cart');

            console.log("product---------------", req.userId);
            var response = await cartclient.findOne({
                "userId": req.userId
            });
            var userclient = await dataBase.collection('user');
            var userdata=await userclient.findOne({user_id:response.userId});
            //console.log("response", response)
            if (response == null) {
                res.json({
                    status: false,
                    message: "Your cart is empty"
                })
            } else {


                // let payment = await instance.payments.fetch(req.body.paymentId);
                //console.log("payment----",payment);
                var orders = [];
                var transactionslist=[];
                console.log("caliculatedcart--------", response.caliculatedCart);
                //each vendor order details
                for (let i = 0; i < response.caliculatedCart.context.length; i++) {
                    var orderObject = {};
                    orderObject.totalcart = {};
                    orderObject.data = response.caliculatedCart.context[i];
                    orderObject.totalcart.totalShippingPrice = response.caliculatedCart.totalShippingPrice;
                    orderObject.totalcart.subtotal = response.caliculatedCart.subtotal;
                    orderObject.totalcart.totalQuantity = response.caliculatedCart.totalQuantity;
                    orderObject.totalcart.total = response.caliculatedCart.total;
                    orderObject.totalcart = JSON.stringify(orderObject.totalcart);
                    orderObject.cartId = response.cartId;
                    orderObject.userId = response.userId;
                    orderObject.billingAddress = response.caliculatedCart.billingAddress;
                    orderObject.orderId = uuidv4();
                    orderObject.payamount = response.caliculatedCart.total;
                    orderObject.paymentId = data.paymentId;
                    orderObject.created = new Date();
                    orderObject.status = "orderplaced";
                    orderObject.username=userdata.name;
                    var today = new Date();
var awd=new Date((today.setHours(new Date().getHours() + 8))*1000);
                    orderObject.awdtime = awd;
                    
                    orders.push(orderObject);
                    transactionslist.push({"orderId":orderObject.orderId,"vendorId":orderObject.data.vendor_info._id,"company":orderObject.data.vendor_info.company,"username":userdata.name,"userId":orderObject.userId,"amount":orderObject.data.total})
                    console.log("orders----------", orders);







                    console.log("order------", orderObject);

                }
                var orderclient = await dataBase.collection('orders');
            
                const options = {
                    ordered: true
                };
                const result = await orderclient.insertMany(orders, options);
                console.log("insert multiple-----------", result);
                var cartclient = await dataBase.collection('cart');
                var vouchersclient = await dataBase.collection('user_vouchers');
                console.log("voucher upp----",response.voucherId ,response.userId);
                const voucherup = await vouchersclient.findOneAndUpdate({
                    "_id":ObjectID(response.voucherId)
                }, {
                    $set: {
                        isUsed:true
                    }
                }, );
                console.log("voucherup----------",voucherup);
                var cartdelete = await cartclient.deleteOne({
                    'userId': req.userId
                });
                var transactionsclient = await dataBase.collection('transactions');
                
                var transaction=await transactionsclient.insertMany(transactionslist, options);
                console.log("ddddd-----", cartdelete,transaction);

                res.json({
                    status: true,
                    message: "Success",
                    orderId: orders,
                })
            }

        }
    } catch (err) {
        // err
        console.log("err", err);
        res.json(err.message);
    }

}



async function getVendorOrders(req, res) {
    
    console.log("orders-------", req.userId);
    // var nosql = new Agent()
    // nosql.select('orders', 'orders').make(function (builder) {
    //     builder.where('userId', req.userId);
    //     builder.sort('created',true);
    //     //builder.fields('company')
    //     //builder.first();
    // })

    // var orders = await nosql.promise('orders');
    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');

    console.log("product---------------", req.userId);
   var query={
    "data.vendor_info._id": ObjectID(req.vendorId),
};
    if(req.query.status!=null && req.query.status!='all')
    {
        
        query.status=req.query.status;
    }
    var response = await orderclient.find(query).sort({
        created: -1
    }).toArray();
    console.log("tttttttttttt", response);
    // res.json({
    //     "response": response
    // });
    res.json({
        status: true,
        data: response
    });
}
async function getVendorOrderbyId(req, res) {
    console.log("orders-------");
    // var nosql = new Agent()
    // nosql.select('orders', 'orders').make(function (builder) {
    //     builder.where('userId', req.userId);
    //     builder.where('orderId', req.params.orderId);
    //     //builder.fields('company')
    //     builder.first();
    // })

    // var orders = await nosql.promise('orders');


    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');
    var response = await orderclient.findOne({
       
        "orderId": req.params.orderId
    });
    console.log("tttttttttttt", response);
    res.json(response);
}
async function getVendorOrdersCount(req, res) {
    console.log("orders-------", req.userId);
    // var nosql = new Agent()
    // nosql.select('orders', 'orders').make(function (builder) {
    //     builder.where('userId', req.userId);
    //     builder.sort('created',true);
    //     //builder.fields('company')
    //     //builder.first();
    // })

    // var orders = await nosql.promise('orders');
    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');

    console.log("product---------------", req.userId);
    var options = {
        allowDiskUse: true
    };

    var pipeline = [{
            "$match": {
                "data.vendor_info._id": ObjectID(req.vendorId),
            }
        },
        {
            "$group": {
                "_id": {
                    "status": "$status"
                },
                "COUNT(*)": {
                    "$sum": 1
                }
            }
        },
        {
            "$project": {
                "status": "$_id.status",
                "count": "$COUNT(*)",
                "_id": 0
            }
        }
    ];

    var cursor = await orderclient.aggregate(pipeline, options).toArray();
    //     var result=[];
    //    await cursor.forEach(
    //         function(doc) {
    //             console.log(doc);
    //             result.push(doc);
    //         }, 
    //         function(err) {

    //         }
    //     );
    console.log("tttttttttttt", cursor);


    var data={"orderplaced":getStatusCount(cursor,"orderplaced"),
    "shipped":getStatusCount(cursor,"shipped"),
    "delivered":getStatusCount(cursor,"delivered"),
    "cancelled":getStatusCount(cursor,"cancelled"),"exchange":getStatusCount(cursor,"exchange"),
    "return":getStatusCount(cursor,"return"),"processing":getStatusCount(cursor,"processing")};
console.log("data",data);

    res.json({
        "responce": data
    });
    //    find({
    //     "data.vendor_info.id": req.vendorId
    // }).sort({created:-1}).toArray();

}
async function getUserVendorOrdersCount(req, res) {
    console.log("orders-------", req.userId);
    // var nosql = new Agent()
    // nosql.select('orders', 'orders').make(function (builder) {
    //     builder.where('userId', req.userId);
    //     builder.sort('created',true);
    //     //builder.fields('company')
    //     //builder.first();
    // })

    // var orders = await nosql.promise('orders');
    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');

    console.log("product---------------", req.userId);
    var options = {
        allowDiskUse: true
    };

    var pipeline = [{
            "$match": {
                
                "userId":req.body.userId
            }
        },
        {
            "$group": {
                "_id": {
                    "status": "$status"
                },
                "COUNT(*)": {
                    "$sum": 1
                }
            }
        },
        {
            "$project": {
                "status": "$_id.status",
                "count": "$COUNT(*)",
                "_id": 0
            }
        }
    ];

    var cursor = await orderclient.aggregate(pipeline, options).toArray();
    //     var result=[];
    //    await cursor.forEach(
    //         function(doc) {
    //             console.log(doc);
    //             result.push(doc);
    //         }, 
    //         function(err) {

    //         }
    //     );
    console.log("tttttttttttt", cursor);


    var data={"orderplaced":getStatusCount(cursor,"orderplaced"),
    "shipped":getStatusCount(cursor,"shipped"),
    "delivered":getStatusCount(cursor,"delivered"),
    "cancelled":getStatusCount(cursor,"cancelled"),"exchange":getStatusCount(cursor,"exchange"),
    "return":getStatusCount(cursor,"return")};
console.log("data",data);

    res.json({
        "responce": data
    });
    //    find({
    //     "data.vendor_info.id": req.vendorId
    // }).sort({created:-1}).toArray();

}
function getStatusCount(cursor,flag){
    var t = cursor.filter(obj => obj.status==flag);
    
    if(t[0] == null){
        return 0;
    }
    return t[0].count;
}

async function updateOrderStatus(req, res) {
    console.log("orders---update status----");
    // var nosql = new Agent()
    // nosql.select('orders', 'orders').make(function (builder) {
    //     builder.where('userId', req.userId);
    //     builder.where('orderId', req.params.orderId);
    //     //builder.fields('company')
    //     builder.first();
    // })

    // var orders = await nosql.promise('orders');
   // console.log("userID---", req.userId);

    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');
    var userclient = await dataBase.collection('user');
    var vendorclient = await dataBase.collection('vendor');
    
    var response;
    if(req.body.status=="processing")
    {
        if(req.body.shippingdate==undefined)
        {
            res.json({
                "message": "Please provide shippingdate",
            });
            return ;
        }
        var today = new Date(req.body.shippingdate);
        var awd=new Date((today.setHours(new Date().getHours() + 8))*1000);
        response = await orderclient.updateOne({
          
            "orderId": req.body.orderId
        }, {
            $set: {
                "status": req.body.status,
                "awdtime":awd,
                "shippingdate":req.body.shippingdate,
                "flag":undefined
            }
        });
    }else
    {
        var today = new Date();
        var awd=new Date((today.setHours(new Date().getHours() + 8))*1000);
         response = await orderclient.updateOne({
            
            "orderId": req.body.orderId
        }, {
            $set: {
                "status": req.body.status,
                "awdtime":awd,
                "flag":undefined
            }
        });
    }
   
    console.log("tttttttttttt", response.matchedCount);
    //user sms sending
    var userresponce = await userclient.findOne({
        "user_id": req.body.userId
    }, {
        projection: {
            "phone_no": 1,
            _id: 0
        }
    });
    console.log("userresponce", userresponce);
    var smsresponce = await sms("919703220974", "your order " + req.body.status);

    //vendor sms sending
    var orderresponce = await orderclient.findOne({
        
        "orderId": req.body.orderId
    });
    var vendorresponce = await vendorclient.findOne({
        "id": orderresponce.data.vendor_info.id
    }, {
        projection: {
            "phone": 1,
            _id: 0
        }
    });
    console.log("vendorresponce", vendorresponce);
    //var smsresponce=await sms("919703220974","your order "+req.body.status);

    console.log("smsresponce-----------", smsresponce);
    res.json({
        "order_matched": response.matchedCount != 0 ? true : false,
        "order_updated": response.modifiedCount != 0 ? true : false
    });
}
async function sms(mobile, message) {
    console.log(mobile, message);



    // Create publish parameters
    var params = {
        Message: message,
        /* required */
        PhoneNumber: mobile,
    };

    // Create promise and SNS service object
    var publishTextPromise = await new AWS.SNS({
        apiVersion: '2010-03-31'
    }).publish(params).promise();
    console.log("publishTextPromise", publishTextPromise)
    console.log("MessageID is " + publishTextPromise.MessageId);
    return {
        message: publishTextPromise.MessageId
    };
    // Handle promise's fulfilled/rejected states
    //   publishTextPromise.then(
    //     function(data) {
    //       console.log("MessageID is " + data.MessageId);
    //       return {message:data.MessageId};
    //     }).catch(
    //       function(err) {
    //       console.error(err, err.stack);
    //       return {message:err.stack};
    //     });




}



module.exports.handler = serverless(app);