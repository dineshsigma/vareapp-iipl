const serverless = require('serverless-http');
const express = require('express')
const app = express();
const { v4: uuidv4 } = require('uuid');
var cors = require('cors')
const { MongoClient } = require('mongodb');


let conn = null;

const URI = 'mongodb+srv://sowmya:iNNrxOhVfEdvsUaI@vare.cnw2n.mongodb.net/vare?retryWrites=true&w=majority';
exports.connect = async function(collectionName) {

    const client = new MongoClient(URI);

    await client.connect();
    const database = client.db("vare");
    const collection = database.collection(collectionName);

  

  return {"collection":collection,"client":client};
};

  