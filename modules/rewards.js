var mongoclient = require('../mongodb');


async function generateAndSendRewards(userId, orderId) {
    var vip = false;
    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');
    var userclient = await dataBase.collection('user');
    var user_reward_pointsclient = await dataBase.collection('user_reward_points');


    var order = await orderclient.findOne({ "orderId": orderId });
    var orderscount = await orderclient.count({ "userId": userId });
    var user = await userclient.findOne({ "user_id": userId });
    var ordervalue = order.data.total
    var points = 0;
    var parentPoints = 0;
    var noof50s = 0;
    console.log("ordervalue-----------", ordervalue, orderscount);
    noof50s = (ordervalue / 50);
    console.log("points------1-----", points);



    //first order  check
    if (orderscount == 1) {
        console.log("first order-----entered-----");
        //this is first order
        points += (noof50s) * 1.5;

    }
    console.log("points-----2------", points);
    if (user.isVip != undefined && user.isVip) {
        console.log("vip  reward-----entered-----");
        points += (noof50s) * 1.5;
    }
    console.log("Reward points-----3------", Math.round(points));
    //purchase reward  check
    points += noof50s;

    console.log("Reward points-----4------", Math.round(points));

    //Day Time Shopping Rewards
    var n = order.created.getHours();
    console.log("gethours------------", n);
    if (13 <= n && n <= 17) {
        points += noof50s * 2
    }

    var rewardtransaction1 = { "orderId": orderId, "userId": userId, "points": Math.round(points), type: "Cr", date: new Date(),reward_from:"order",tag:"" };

    console.log("Reward points-----5------", Math.round(points));
    var userrpo = await user_reward_pointsclient.insert(rewardtransaction1);
    var updateuserpoints = await userclient.findOneAndUpdate({ "user_id": userId },{$inc:{'points':Math.round(points)}});
    console.log("userrpo--------", updateuserpoints);


    if (user.referral_user_id != undefined) {
        //refferal user
        var parentUser = await userclient.findOne({ "user_id": user.referral_user_id });
        parentPoints = (noof50s) * 1;
        if (parentUser.isVip != undefined && parentUser.isVip) {
            console.log("parent vip  reward-----entered-----");
            parentPoints += (noof50s) * 1.5;
        }
        console.log("Parent Reward points-----6------", Math.round(parentPoints));
        var rewardtransaction = { "orderId": orderId, "userId": user.referral_user_id, "points": Math.round(parentPoints), type: "Cr", date: new Date(),reward_from:"shareapp" ,tag:""};

        var userrpo = await user_reward_pointsclient.insert(rewardtransaction);
        console.log("userrpo--------", userrpo);
        var updateparentuserpoints = await userclient.findOneAndUpdate({ "user_id": user.referral_user_id },{$inc:{'points':Math.round(points)}});
    console.log("userrpo--------", updateparentuserpoints);
       

    }else{
        console.log("no parent found-----------");
    }



}

async function venderRewards(userId,rewardType) {

    var dataBase = await mongoclient.connect();

    var orderclient = await dataBase.collection('orders');
    var userclient = await dataBase.collection('user');
    var vendor_reward_pointsclient = await dataBase.collection('vendor_reward_points');

    var user = await userclient.findOne({ "user_id": userId });
   
if(rewardType=="welcome")
{
    var points=50;
    var rewardtransaction1 = {  "userId": userId,'vendorId':user.vendorId, "points": points, type: "Cr", date: new Date(),reward_from:"welcome",tag:"welcome git point" };

    var vendorrpo = await vendor_reward_pointsclient.insert(rewardtransaction1);
    var updateuserpoints = await userclient.findOneAndUpdate({ "user_id": userId },{$inc:{'points':points}});
    console.log("userrpo--------", updateuserpoints);
}else{
console.log("vendor another rewards------------");
}

    



}
module.exports.generateAndSendRewards = generateAndSendRewards;
module.exports.venderRewards = venderRewards;