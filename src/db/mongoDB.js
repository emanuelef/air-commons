const HOST = process.env.MONGO_DB_ENDPOINT;
const DB_NAME = process.env.MONGO_DB_NAME;
const DB_USERNAME = process.env.MONGO_DB_USERNAME;
const DB_PASSWORD = process.env.MONGO_DB_PASSWORD;

const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(HOST);

let db;

module.exports = {
  connect() {
    return new Promise((resolve, reject) => {
      client.connect(err => {
        if (err) return reject(err);
        console.log("Connected successfully to server");
        db = client.db(DB_NAME);
        resolve(db);
      });
    });
  },
  getDb() {
    return db;
  }
};

/*
(async function() {
  try {
    await client.connect();
    console.log("Connected correctly to server");
    const db = client.db(DB_NAME);
    const col = db.collection("flights");

  } catch (err) {
    console.log(err.stack);
  }
  client.close();
})();
*/

/*
    const cursor = col.find({ a: 1 }).limit(2);
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      console.dir(doc);
    }
    */

const indexCollection = function(db, callback) {
  db.collection("documents").createIndex({ a: 1 }, null, function(
    err,
    results
  ) {
    console.log(results);
    callback();
  });
};

const writeToDbPassages = item => {
  //let r = await col.insertOne({ a: 1 });
  let modItem = {
    ...item
  };
  modItem.startTime = modItem.startTime / 1000;
  modItem.minDTimestamp = modItem.minDTimestamp / 1000;
};

//exports.writeToDbPassagesMongo = writeToDbPassages;

/*
db.Collection.find({
    created_at : {
        '$gte': new Timestamp(new Date(2012, 0, 21), 0),
        '$lte': new Timestamp(new Date(2012, 0, 22), 0)
    }
})
*/
