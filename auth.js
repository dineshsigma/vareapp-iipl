const serverless = require('serverless-http');
const express = require('express')
const app = express();
const { v4: uuidv4 } = require('uuid');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var request = require('request');
var PhoneNumber = require('awesome-phonenumber');
var otplib = require('otplib');
var mongoclient = require('./mongodb');
const { ObjectId } = require('mongodb');
var referralcodes = require('referral-codes');

otplib.authenticator.options = {
  step: 900,
  window: 1,
  digits: 6
};
//var allowlist = ['http://localhost:4002/', 'https://dev-sls.happimobiles.com/']
var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    if (allowlist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: false } // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
}
app.options('*', cors()) // include before other routes
app.use(cors());

// mongo db connection 
var MONGO_DB_CONNECTION = process.env.MONGO_DB_CONNECTION || 'mongodb+srv://sowmya:iNNrxOhVfEdvsUaI@vare.cnw2n.mongodb.net/vare?retryWrites=true&w=majority';
console.log('MONGO_DB_CONNECTION', MONGO_DB_CONNECTION);
var Agent = require('sqlagent/mongodb').connect(MONGO_DB_CONNECTION);


// const mongoClient = require('mongodb').MongoClient
// var dataBase= await mongoClient.connect(MONGO_DB_CONNECTION)


// otplib secret key
// var JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'happi_jwt_secrethappi_jwt_secrethappi_jwt_secret';
// var OTP_SECRET = process.env.OTP_SECRET || 'ETTRTFGFCFSCGJLKLLUIOYUITTFFGCFZXEAWRRTTIUIGHFER';
// var MONGO_DB_CONNECTION = process.env.MONGO_DB_CONNECTION || 'ETTRTFGFCFSCGJLKLLUIOYUITTFFGCFZXEAWRRTTIUIGHFER';

var JWT_SECRET_KEY = 'dmFyZWFwcGl2b3J5aW5ub3ZhdGlvbnNoYXJpa3Jpc2huYTE3Mjk=';

//jsonparser
app.use(express.json());

// send otp to user
app.post('/api/auth/user-login', async function (req, res) {
   var nosql = new Agent();
    var pn = new PhoneNumber(req.body.phone, 'IN');
    //console.log('pn',pn);
    // if (req.body.phone == "9876543210" || req.body.phone == "9988776655" || req.body.phone == "8686836269" || req.body.phone == "8099592649" || req.body.phone == "9000247654" ) {
    //   res.json({
    //     status: true,
    //     message: "Otp Sent"
    //   })
    //   return;
    // }
    if (pn.isValid()) {

        res.json({
            status: true,
            message: "Otp Sent"
        })
        return;

        // const secret = OTP_SECRET + req.body.phone;
        // const token = otplib.authenticator.generate(secret);
        // var options = {
        //     'method': 'GET',
        //     'url': `https://2factor.in/API/V1/e27f1a8a-e428-11e9-9721-0200cd936042/SMS/${req.body.phone}/${token}/Happi`,
        // };
        // request(options, async function (error, response) {
        //     var result = JSON.parse(response.body);
        //     console.log("result", result)
        //     if (result.Status == "Success") {
        //         // enter request data into otp_request collection
        //         nosql.insert('otp', 'otp_request').make(function (builder) {
        //             builder.set('phone', req.body.phone);
        //             builder.set('timeStamp', new Date());
        //         })

        //         var optRequest = await nosql.promise('otp');

        //         console.log("optRequest", optRequest);
        //         res.json({
        //             status: true,
        //             message: "Otp Sent"
        //         })
        //     } else {
        //         res.json({
        //             status: false,
        //             message: "Unable to send OTP"
        //         })
        //     }
        // });
    } else {
        res.json({
            status: false,
            message: "Invalid Phone number"
        })
    }

})


// user otp verify 
app.post('/api/auth/user-verify/', async function (req, res) {
    var data = req.body;
    
   var nosql = new Agent();

    if (data.otp == "123456") {

        // user check
        nosql.select('user', 'user').make(function (builder) {
            builder.where('phone_no', data.phone);
            builder.first();
        });
        var user = await nosql.promise('user');
        if (user == null) {

            return res.json({
                status: true,
                message: "New User",
                isnewuser:true,
                token: jwt.sign({ phone: data.phone}, JWT_SECRET_KEY, {
                    expiresIn: '1d'
                }),
            });


        } else {
console.log("user",user);
            return res.json({
                status: true,
                message: "Registerd User",
                userData :user,
                isnewuser:false,

                token: jwt.sign({ phone: data.phone,userId:user.user_id,vendorId:user.vendorId}, JWT_SECRET_KEY, {
                    expiresIn: '180d'
                }),
            });

        }
        
        //vendor check
        // nosql.select('vendor', 'vendor').make(function (builder) {
        //     builder.where('phone', data.phone);
        //     builder.first();
        // });
        // var vendor = await nosql.promise('vendor');
        // if ( vendor == null){

        // }

    } else {
        return res.json({
            status: false,
            message: "Invalid OTP"
        });
    }


    const secret = OTP_SECRET + data.phone;

    var isValid = otplib.authenticator.check(data.otp, secret);
    console.log("PHONE", data.phone, isValid);
    if (data.otp == "PHONEPE") {
        isValid = true;
    }
    if (data.otp == "FRESHBOT") {
        isValid = true;
    }
    if (data.otp == "REGISTER_USER") {
        isValid = true;
    }
    if ((req.body.phone == "9876543210" || req.body.phone == "9988776655" || req.body.phone == "8686836269" || req.body.phone == "8099592649" || req.body.phone == "9000247654") && data.otp == "456789") {
        isValid = true;
    }
    if (!isValid) {
        return res.json({
            status: false,
            message: "Invalid OTP"
        });
    }
    var nosql = new Agent();

    // user
    nosql.select('user', 'user').make(function (
        builder) {
        builder.where('phone', data.phone);
        builder.first();
    });

    var user = await nosql.promise('user');

    if (user == null) {

        var result = {
            status: true,
            token: jwt.sign({ phone: data.phone }, JWT_SECRET_KEY, {
                expiresIn: '180d'
            }),
            event: "REGISTER_USER",
        };
        res.json(result);

    } else {

        if (user.role == "admin") {
            var userObj = {
                id: user.id,
                "aud": "application-0-lgxvg",
                "sub": user.phone,
                UID: user.phone,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                access: user.access,
            }
            var result = {
                status: true,
                token: jwt.sign(userObj, JWT_SECRET_KEY, {
                    expiresIn: '12h'
                }),
                event: "HOME",
                data: userObj
            };
            res.json(result);
        } else {
            var userObj = {
                id: user.id,
                "aud": "application-0-lgxvg",
                "sub": user.phone,
                UID: user.phone,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                address: user.address
            }
            var result = {
                status: true,
                token: jwt.sign(userObj, JWT_SECRET_KEY, {
                    expiresIn: '180d'
                }),
                event: "HOME",
                data: userObj
            };
            res.json(result);
        }
    }
})

// User registration
/*
User Register Mandatory Fields

*/
app.post('/api/auth/user', async function (req, res) {

    var form = req.body;
    var nosql = new Agent();
    var token = req.headers['x-user-auth'];
    // token verify
    console.log("TRIGGERED USER SAVE");
    if (token != null) {
        try {
            var decoded = jwt.verify(token, JWT_SECRET_KEY);
            console.log('decoded',decoded);
            if (decoded != null) {
                console.log("decoded", decoded, form);
                if (decoded.phone != form.phone_no) {

                    res.json({
                        status: false,
                        message: "You are not allowed to access this data"
                    });
                    return;
                };

                nosql.select('user', 'user').make(function (builder) {
                    builder.where('phone_no', decoded.phone);
                    builder.first()
                });

                var user = await nosql.promise('user');

                // adding an user
                if (user == null) {
                   // form.id = uuidv4();
                    form.created = new Date();
                    var referralcode=referralcodes.generate({
                        length: 8,
                        count: 1
                    });
                    form.referralcode=referralcode[0];
                    nosql.insert('addUser', 'user').make(function (builder) {
                        builder.set(form);

                    });
                    await nosql.promise('addUser');
                }
                else { // update user
                    form.dateupdated = new Date();
                    nosql.update('updateUser', 'user').make(function (builder) {
                        builder.set(form);
                        builder.where('phone_no', decoded.phone);
                    });
                    await nosql.promise('updateUser');
                }

                nosql.select('getUser', 'user').make(function (builder) {
                    builder.where('phone_no', decoded.phone);
                    builder.first();
                });
                var getuser = await nosql.promise('getUser')
                console.log("getuser", getuser);
               
                 res.json({
                    status: true,
                    message: "Register User successfully",
                    userData :getuser,
            
    
                    token: jwt.sign({ phone: getuser.phone_no,userId:getuser.user_id }, JWT_SECRET_KEY, {
                        expiresIn: '180d'
                    }),
                });


            }
        } catch (err) {
            // err
            console.log("err", err);
            res.json({
                status: false,
                message: "Invalid Token"
            });
        }
    } else {
        res.json({
            status: false,
            message: "Please Provide Token"
        });
    }


});
app.get('/api/auth/user', async function (req, res) {

    var form = req.body;
    var nosql = new Agent();
    var token = req.headers['x-user-auth'];
    // token verify
    console.log("TRIGGERED USER SAVE");
    if (token != null) {
        try {
            var decoded = jwt.verify(token, JWT_SECRET_KEY);
            console.log('decoded',decoded);
            if (decoded != null) {
                var database = await mongoclient.connect();
                var userclient=database.collection('user');
                var user_dayclient=database.collection('user_day_log');

                const userdata = await userclient.findOne({ "user_id": decoded.userId })
                  console.log("user added update------------",userdata);
                  if(req.query.from=="welcome")
                  {
                      var dateObj=new Date();
                      var month = dateObj.getUTCMonth() + 1; //months from 1-12
var day = dateObj.getUTCDate();
var year = dateObj.getUTCFullYear();
                      var todayid=year + "/" + month + "/" + day;
                      var user_dayfind=await user_dayclient.findOne({ "user_id": decoded.userId,"opens":{$in:[todayid]}});
if(user_dayfind==null)
{
                      var update=await user_dayclient.findOneAndUpdate({ "user_id": decoded.userId },{$push:{'opens':todayid},$set:{"openscount":+1}},{upsert:true})
console.log("open save---------",update);
                    }else{
console.log("open save not requered--------");
}
                    }
                res.json({
                    status: true,
                    message: "Success",
                    data: userdata
                })
            }
        } catch (err) {
            // err
            console.log("err", err);
            res.json({
                status: false,
                message: "Invalid Token"
            });
        }
    } else {
        res.json({
            status: false,
            message: "Please Provide Token"
        });
    }


});
app.get('/api/auth/vendorinfo', async function (req, res) {

    var form = req.body;
    var nosql = new Agent();
    var token = req.headers['x-user-auth'];
    // token verify
    console.log("TRIGGERED USER SAVE");
    if (token != null) {
        try {
            var decoded = jwt.verify(token, JWT_SECRET_KEY);
            console.log('decoded',decoded);
            if (decoded != null) {
                var database = await mongoclient.connect();
                var vendorclient=database.collection('vendor');
                var postsclient=database.collection('posts');
                var followsclient=database.collection('follow');

                const vendor = await vendorclient.findOne({ "id": req.query.vendorId })
                const noofposts = await postsclient.count({ "vendorId": req.query.vendorId });
                const nooffollowers = await followsclient.count({ "vendorId": req.query.vendorId,isFollow:true });
                const isfollowing = await followsclient.findOne({ "vendorId": req.query.vendorId,followById:decoded.userId,isFollow:true });
                  console.log("vendor info ------------",vendor);
                res.json({
                    status: true,
                    message: "Success",
                    vendorinfo:{details: vendor,
                    noofposts:noofposts,
                    nooffollowers:nooffollowers,
                    isfollowing:isfollowing==null?false:true
                    }
                })
            }else{
                res.json({
                    status: false,
                    message: "Invalid Token"
                });
            }
        } catch (err) {
            // err
            console.log("err", err);
            res.json({
                status: false,
                message: "Invalid Token"
            });
        }
    } else {
        res.json({
            status: false,
            message: "Please Provide Token"
        });
    }


});
app.post('/api/auth/address', async function (req, res) {

    var form = req.body;
    var nosql = new Agent();
    var token = req.headers['x-user-auth'];
    // token verify
    console.log("TRIGGERED USER SAVE");
    if (token != null) {
        try {
            var decoded = jwt.verify(token, JWT_SECRET_KEY);
            console.log('decoded',decoded);
            if (decoded != null) {
                console.log("decoded", decoded, form);
                // if (decoded.phone != form.phone_no) {

                //     res.json({
                //         status: false,
                //         message: "You are not allowed to access this data"
                //     });
                //     return;
                // };
                var dataBase = await mongoclient.connect();
                var userclient = await dataBase.collection('user');
                const update = await userclient.findOneAndUpdate({ "user_id": decoded.userId },{
                    $push: {
                      "addresses":req.body
                    }
                  },);
                  
                
                  const userdata = await userclient.findOne({ "user_id": decoded.userId })
                  console.log("user added update------------",userdata);
                res.json({
                    status: true,
                    message: "Success",
                    data: userdata
                })
            }

            
        } catch (err) {
            // err
            console.log("err", err);
            res.json({
                status: false,
                message: "Invalid Token"
            });
        }
    } else {
        res.json({
            status: false,
            message: "Please Provide Token"
        });
    }


});
app.post('/api/auth/vip', async function (req, res) {

    var form = req.body;
    var nosql = new Agent();
    var token = req.headers['x-user-auth'];
    // token verify
    console.log("TRIGGERED USER SAVE------------------------vip");
    if (token != null) {
        try {
            var decoded = jwt.verify(token, JWT_SECRET_KEY);
            console.log('decoded',decoded);
            if (decoded != null) {
                console.log("decoded", decoded, form);
                // if (decoded.phone != form.phone_no) {

                //     res.json({
                //         status: false,
                //         message: "You are not allowed to access this data"
                //     });
                //     return;
                // };
                var dataBase = await mongoclient.connect();
                var userclient = await dataBase.collection('user');
                const update = await userclient.findOneAndUpdate({ "user_id": decoded.userId },{
                    $set: {
                      "isVip":true,"vippaymentId":form.paymentId
                    }
                  },);
                  
                
                  const userdata = await userclient.findOne({ "user_id": decoded.userId })
                  console.log("user added update------------",userdata);
                res.json({
                    status: true,
                    message: "Success",
                    data: userdata
                })
            }

            
        } catch (err) {
            // err
            console.log("err", err);
            res.json({
                status: false,
                message: "Invalid Token"
            });
        }
    } else {
        res.json({
            status: false,
            message: "Please Provide Token"
        });
    }


});

app.post('/api/auth/vendor/register', async function (req, res) {

    var form = req.body;
    var nosql = new Agent();
    var token = req.headers['x-user-auth'];
    // token verify
    console.log("TRIGGERED USER SAVE------------------------vip");
    if (token != null) {
        try {
            var decoded = jwt.verify(token, JWT_SECRET_KEY);
            console.log('decoded',decoded);
            if (decoded != null) {
                console.log("decoded", decoded, form);
                // if (decoded.phone != form.phone_no) {

                //     res.json({
                //         status: false,
                //         message: "You are not allowed to access this data"
                //     });
                //     return;
                // };
                var dataBase = await mongoclient.connect();
                var userclient = await dataBase.collection('user');
                var vendorclient = await dataBase.collection('vendor');
                var vendor=await vendorclient.insertOne(form);
console.log("vendor-----",vendor);
                const update = await userclient.findOneAndUpdate({ "user_id": decoded.userId },{
                    $set: {
                        "isVendorActive": false,"vendorId": ObjectId(vendor.insertedId).toString()
                    }
                  },);
                  
                
                  const userdata = await userclient.findOne({ "user_id": decoded.userId })
                  console.log("user added update------------",userdata);
                res.json({
                    status: true,
                    message: "Success",
                    data: userdata
                })
            }

            
        } catch (err) {
            // err
            console.log("err", err);
            res.json({
                status: false,
                message: "Invalid Token"
            });
        }
    } else {
        res.json({
            status: false,
            message: "Please Provide Token"
        });
    }


});

app.post('/api/auth/updateDefaultAddress', async function (req, res) {

    var form = req.body;
    var nosql = new Agent();
    var token = req.headers['x-user-auth'];
    // token verify
    console.log("TRIGGERED USER SAVE------------------------vip");
    if (token != null) {
        try {
            var decoded = jwt.verify(token, JWT_SECRET_KEY);
            console.log('decoded',decoded);
            if (decoded != null) {
                console.log("decoded", decoded, form);
                // if (decoded.phone != form.phone_no) {

                //     res.json({
                //         status: false,
                //         message: "You are not allowed to access this data"
                //     });
                //     return;
                // };
                var dataBase = await mongoclient.connect();
                var userclient = await dataBase.collection('user');
                const update = await userclient.findOneAndUpdate({ "user_id": decoded.userId },{
                    $set: {
                      "selectedAddress":form.index,
                    }
                  },);
                  
                
                  const userdata = await userclient.findOne({ "user_id": decoded.userId })
                  console.log("user added update------------",userdata);
                res.json({
                    status: true,
                    message: "Success",
                    data: userdata
                })
            }

            
        } catch (err) {
            // err
            console.log("err", err);
            res.json({
                status: false,
                message: "Invalid Token"
            });
        }
    } else {
        res.json({
            status: false,
            message: "Please Provide Token"
        });
    }


});
app.post('/api/auth/admin-login', async function (req, res) {
  
    var data = req.body;
    
    var nosql = new Agent();
 
    
 
         // user check
         nosql.select('admin', 'admin').make(function (builder) {
             builder.where('email', data.email);
             builder.where('password', data.password);
             builder.first();
         });
         var admin = await nosql.promise('admin');
         if (admin == null) {
 
             return res.json({
                 status: false,
                 message: "no admin user found",
                
             });
 
 
         } else {
 console.log("user",admin);
             return res.json({
                 status: true,
                 message: "Registerd User",
                 userData :admin,
                 token: jwt.sign({ email: admin.email,userId:admin._id.toString(),}, JWT_SECRET_KEY, {
                    expiresIn: '2d'
                }),
               
             });
 
         }
         
     
    
 
 
 })
module.exports.handler = serverless(app);