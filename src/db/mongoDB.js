const HOST = process.env.MONGO_DB_ENDPOINT;
const DB_NAME = process.env.MONGO_DB_NAME;
const DB_USERNAME = process.env.MONGO_DB_USERNAME;
const DB_PASSWORD = process.env.MONGO_DB_PASSWORD;

const MongoClient = require("mongodb").MongoClient;

let db;
let col;

module.exports = {
  async connect(collection) {
    const client = await MongoClient.connect(HOST, { useNewUrlParser: true });
    console.log("Connected correctly to server");
    db = client.db(DB_NAME);
    col = db.collection(collection);
    return col;
  },
  getDb() {
    return db;
  },
  getCollection() {
    return col;
  },
  async writeToDb(data) {
    return await col.insertOne(data);
  }
};


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


/*
db.Collection.find({
    created_at : {
        '$gte': new Timestamp(new Date(2012, 0, 21), 0),
        '$lte': new Timestamp(new Date(2012, 0, 22), 0)
    }
})
*/
