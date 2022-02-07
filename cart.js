const serverless = require('serverless-http');
const express = require('express')
const app = express();
const {
    v4: uuidv4
} = require('uuid');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var mongoclient = require('./mongodb');
const e = require('express');

app.use(express.json());
app.use(cors());

// mongo db connection 
var MONGO_DB_CONNECTION = process.env.MONGO_DB_CONNECTION || 'mongodb+srv://sowmya:iNNrxOhVfEdvsUaI@vare.cnw2n.mongodb.net/vare?retryWrites=true&w=majority';
console.log('MONGO_DB_CONNECTION', MONGO_DB_CONNECTION);
var Agent = require('sqlagent/mongodb').connect(MONGO_DB_CONNECTION);


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
        next();
    } catch (err) {
        // err
        console.log("err----", err.message);
        return res.status(401).json({
            message: "Unauthorised"
        });
    }
});
app.post('/api/cart/', createCart);
app.post('/api/cart/addvouchers', addvoucher);
app.get('/api/cart/', getCart);
app.get('/api/cart/group', getGroupCart);

async function createCart(req, res) {

    var data = req.body;
    console.log("data-----------", data);
    var dataBase = await mongoclient.connect();

    var cartclient = await dataBase.collection('cart');

    console.log("product---------------", req.userId,data.item.productId);
    var cart0 = await cartclient.findOne({
        "userId": req.userId
    });

    var cart = await cartclient.findOne({
        "userId": req.userId,
        "items.productId": data.item.productId
    });
    var cart1;
console.log("mamammamam-----------",cart);
    if (cart == null) {
        if (data.delete) {
            res.json({
                status: true,
                message: "Not found",

            });
        } else {
            if (cart0 == null) {
                cart2 = await cartclient.insertOne({
                    "userId": req.userId,
                    "items": [data.item],
                    "products":[data.item.productId],
                    "cartId":uuidv4()
                });
                res.json({
                    status: true,
                    message: "created",

                });
            } else {
                cart1 = await cartclient.update({
                    "userId": req.userId
                }, {
                    $addToSet: {
                        "items": data.item
                    }
                });
                res.json({
                    status: true,
                    message: "product newly added",

                });
            }


        }
    } else {
        if (data.delete) {
            console.log("delete-------entered")
            cart1 = await cartclient.update({
                "userId": req.userId,
                "items.productId": data.item.productId
            }, {
                $pull: {
                    "items": {
                        "productId": data.item.productId
                    }
                },
                // $pull: {
                //     "products": data.item.productId
                    
                // }
            });

return getCart(req,res);
            // res.json({
            //     status: true,
            //     message: "deleted",

            // });

        } else {
            cart1 = await cartclient.updateOne({
                "userId": req.userId,
                "items.productId": data.item.productId
            }, {
                $inc: {
                    "items.$.quantity": data.item.quantity
                }
            });
            console.log("vvvvvvvv--------------",cart1);

            // res.json({
            //     status: true,
            //     message: "product quantity updated",

            // });
            return getCart(req,res);
        }
    }

    
}
async function addvoucher(req,res){
    var data = req.body;
    console.log("data-----------", data);
    var dataBase = await mongoclient.connect();

    var cartclient = await dataBase.collection('cart');
    var user_vouchersclient = await dataBase.collection('user_vouchers');
    console.log("product---------------", req.userId,);
    var cart0 = await cartclient.findOne({
        "userId": req.userId
    });
    if(cart0!=null)
    {
        if(data.isadd)
        {
       var uservoucher= await user_vouchersclient.findOne({"_id":ObjectID(data.id)});
       cartclient.findOneAndUpdate({"userId": req.userId},{$set:{"voucherId":data.id,"voucher_offer":uservoucher.offer_percentage,"voucher_miniorder":uservoucher.minorder,
       "voucher_maxcashback":uservoucher.maxcashback,"voucher_vendorId":uservoucher.vendorId
    }});
}else{
    var uservoucher= await user_vouchersclient.findOne({"_id":ObjectID(data.id)});
       cartclient.findOneAndUpdate({"userId": req.userId},{$unset:{"voucherId":"","voucher_offer":"","voucher_miniorder":"",
       "voucher_maxcashback":""
    }});
}
    return getCart(req,res);
    }else{
        res.json({staus:false,message:"no cart found"});
    }

}

async function getCart(req, res) {
    //console.log("GET CART API CALLED ---------------------------------------------");
    var cartData
    var mnosql = new Agent();





    try {

        if (req.userId != null) {
            var dataBase = await mongoclient.connect();
            var cartclient = await dataBase.collection('cart');
            var response = await cartclient.findOne({
                "userId": req.userId
            });
          console.log("response", response)
            if (response == null||response.items.length<=0) {
                res.json({
                    status: false,
                    message: "Your cart is empty"
                })
            } else {

                // for (let i = 0; i < response.products.length; i++) {
                //     var obj = {};
                //     var cartProduct = response.products[i];
                //     // stock check
                //     var { product, err } = await FetchProduct(cartProduct);
                //     //console.log("product", product);
                //     if (product == "Product Out of Stock") {
                //         cartProduct.statusCode = "OUTOFSTOCK";
                //     }
                //     if (err || product == null) {
                //         res.json({
                //             status: false,
                //             message: "Invalid Product"
                //         })
                //         return;
                //     }


                // }

                var cartData = await processCart(response);
                // // get user details
                // cartData.userDetails = await getUserDetails(response.userId)
                console.log("cartdata-------", cartData.cart);
                delete cartData.cart.products;
                delete cartData.cart.vendors;
                //var data = await groupCartItems(response);

                res.json({
                    status: true,
                    message: "Success",
                    data: cartData.cart,
                    //billingDetails: cartData.userDetails.billingAddress
                })
            }

        }
    } catch (err) {
        // err
        console.log("err", err);
        res.json("Invalid Token");
    }

}
async function getGroupCart(req, res) {
    //console.log("GET CART API CALLED ---------------------------------------------");

    var mnosql = new Agent();





    try {

        if (req.userId != null) {
            var dataBase = await mongoclient.connect();
            var cartclient = await dataBase.collection('cart');
            var response = await cartclient.findOne({
                "userId": req.userId
            });
          console.log("response", response)
            //console.log("response", response)
            if (response == null) {
                res.json({
                    status: false,
                    message: "Your cart is empty"
                })
            } else {

                // for (let i = 0; i < response.products.length; i++) {
                //     var obj = {};
                //     var cartProduct = response.products[i];
                //     // stock check
                //     var { product, err } = await FetchProduct(cartProduct);
                //     //console.log("product", product);
                //     if (product == "Product Out of Stock") {
                //         cartProduct.statusCode = "OUTOFSTOCK";
                //     }
                //     if (err || product == null) {
                //         res.json({
                //             status: false,
                //             message: "Invalid Product"
                //         })
                //         return;
                //     }


                // }
                var cart = {};
                var cartData = await processCart(response);
                var vendorsData = [];
                for (let i = 0; i < cartData.vendors.length; i++) {
                    var vendorObj = {};
                    vendorObj.vendor_info = await getVendorDetails(cartData.vendors[i]);
                    vendorObj.items = [];
                    vendorObj.totalShippingPrice = 0;
                    vendorObj.subtotal = 0;
                    vendorObj.totalQuantity = 0;
                    vendorObj.total = 0;
                    for (let j = 0; j < cartData.cart.items.length; j++) {

                        if (cartData.cart.items[j].vendorId == cartData.vendors[i]) {
                            vendorObj.items.push(cartData.cart.items[j]);
                            if (cartData.cart.items[j].shipping_fee != undefined)
                                vendorObj.totalShippingPrice += parseInt(cartData.cart.items[j].shipping_fee);
                            else
                                vendorObj.totalShippingPrice += 0;

                            vendorObj.subtotal += cartData.cart.items[j].itemTotal;
                            vendorObj.totalQuantity = cartData.cart.items[j].liveQuantity

                            vendorObj.total = vendorObj.subtotal + vendorObj.totalShippingPrice;
                        }

                    }


                    vendorsData.push(vendorObj);

                }
                cart.context = vendorsData;
                cart.totalShippingPrice = cartData.cart.totalShippingPrice;
                cart.subtotal = cartData.cart.subtotal;
                cart.totalQuantity = cartData.cart.totalQuantity;
                cart.total = cartData.cart.total;
                cart.billingAddress = cartData.cart.billingAddress;
                //  var data = await groupCartItems(response);
                var cartclient = await dataBase.collection('cart');
                console.log("cart-Id-----------------", response.cartId);
                const update = await cartclient.findOneAndUpdate({
                    "userId": req.userId
                }, {
                    $set: {
                        'caliculatedCart': cart
                    }
                }, );
                console.log("cart update------------", update);

                res.json({
                    status: true,
                    message: "Success",
                    data: cart
                })
            }

        }
    } catch (err) {
        // err
        console.log("err", err);
        res.json("Invalid Token");
    }

}

async function processCart(cart) {
    var totalShippingPrice = 0;
    var SubTotal = 0;
    var TotalQuantity = 0;
    var vendors = [];
    if (cart.products != undefined) {
        for (var i = 0; i < cart.items.length; i++) {
            var item = cart.items[i];
            var dataBase = await mongoclient.connect();

            var productclient = await dataBase.collection('products');
            console.log("product-Id-----------------", item.productId);
            var product = await productclient.findOne({
                "productId": item.productId
            });
            console.log("product------------------", product);
            if (product == null) {
                return;
            }
            item.ourprice = product.ourprice;
            item.name = product.name;
            item.stock = product.stock;
            item.image_url = product.image_url;
            item.mrp = product.mrp;
            item.vendorId = product.vendorId;
            item.brandsize = product.brandsize;
            item.shipping_fee = product.shipping_fee
            if (item.cartPrice != item.ourprice) {
                item.priceMsg = 'Sorry Price has been changed';
            }
            if (item.quantity > item.stock) {
                item.stockMsg = 'Stock issue';
                item.itemTotal = item.stock * item.ourprice;
                item.liveQuantity = item.stock;
                TotalQuantity = TotalQuantity + item.stock;
            } else {
                item.liveQuantity = item.quantity;
                item.itemTotal = item.quantity * item.ourprice;
                TotalQuantity = TotalQuantity + item.quantity;
            }

            SubTotal = SubTotal + item.itemTotal;

            if (product.shipping_fee != undefined) {
                totalShippingPrice += parseInt(product.shipping_fee);
            }
            // SubTotal += (product.cartPrice * product.quantity);
            // TotalQuantity += product.quantity;
            console.log("vendorid------------", product.vendorId)
            if (vendors.indexOf(product.vendorId) == -1 && product.vendorId != undefined) {
                console.log("vendors---222222---", vendors);
                vendors.push(product.vendorId);
            }
        }

        //voucher amount caliculate
        if(cart.voucherId!=undefined)
        {
var amount=parseInt((SubTotal*cart.voucher_offer)/100);
if(amount>=cart.maxcashback)
{
    cart.voucher_offeramount=cart.maxcashback;
}else{
    cart.voucher_offeramount=amount;
}
console.log("voucher offer--------",cart.voucher_offeramount);
        }//end voucher
    }
    console.log("totototototo-----------------", totalShippingPrice);
    cart.totalShippingPrice = totalShippingPrice;
    cart.subtotal = SubTotal;
    cart.totalQuantity = TotalQuantity;
   

        if (cart.voucher_offeramount != null)
        {
        cart.subtotal  = SubTotal - cart.voucher_offeramount;

        }

    //shipping
        if (totalShippingPrice != null)
        cart.total = cart.subtotal  + totalShippingPrice;
    else
        cart.total = cart.subtotal ;
    //sample id
    var userDetails = await getUserDetails(cart.userId)

    cart.billingAddress = userDetails.billingAddress;
    // coupon discount
    // if (cart.discount > 0) {
    //     //console.log("discount greater than 0");
    //     cart.totalPrice = (totalShippingPrice + SubTotal) - (cart.discount);
    //     cart.TotalQuantity = TotalQuantity;
    //     cart.SubTotal = SubTotal;
    //     cart.totalShippingPrice = totalShippingPrice;

    // } else {
    //     cart.totalPrice = totalShippingPrice + SubTotal;
    //     cart.TotalQuantity = TotalQuantity;
    //     cart.SubTotal = SubTotal;
    //     cart.totalShippingPrice = totalShippingPrice;
    // }
    //console.log("cart", cart);
    console.log("vendorsffff------------", vendors)

    return {
        "cart": cart,
        "vendors": vendors
    };
}





async function getVendorDetails(id) {
    console.log("vendorid-------", id);
    var nosql = new Agent()
    var dataBase = await mongoclient.connect();
    var vendorclient = await dataBase.collection('vendor');
    var vendor = await vendorclient.findOne({
        "_id": ObjectID(id),

    },{ projection: {"company":1,"id":1}});
  console.log("response", vendor)
    // nosql.select('vendor', 'vendor').make(function (builder) {
    //     builder.where('id', id);
    //     builder.fields('company', 'id')
    //     builder.first();
    // })

    // var vendor = await nosql.promise('vendor');
    console.log("tttttttttttt", vendor)
    return vendor;
}

async function getUserDetails(id) {
    console.log("user-------", id);
    var nosql = new Agent()
    var dataBase = await mongoclient.connect();
            var userclient = await dataBase.collection('user');
            var response = await userclient.findOne({
                "user_id": id
            });
          console.log("response", response)
    // nosql.select('getUser', 'user').make(function (builder) {
    //     builder.where('user_id', id);
    //     //builder.fields('company','id')
    //     builder.first();
    // })

    // var user = await nosql.promise('getUser');
    console.log("nnni", response)
    response.billingAddress = response.addresses[response.selectedAddress];
    delete response.addresses;
    delete response.selectedAddress;
    console.log("tttttttttttt", response)
    return response;
}





module.exports.handler = serverless(app);