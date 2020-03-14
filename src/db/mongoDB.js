const HOST = process.env.MONGO_DB_ENDPOINT;
const DB_NAME = process.env.MONGO_DB_NAME;
const DB_USERNAME = process.env.MONGO_DB_USERNAME;
const DB_PASSWORD = process.env.MONGO_DB_PASSWORD;

const MongoClient = require("mongodb").MongoClient;

let db;
let col;

module.exports = {
  async connect(collection) {
    const client = await MongoClient.connect(HOST, {
      useNewUrlParser: true,
      // reconnectInterval: 10000,
      // reconnectTries: Number.MAX_VALUE,
      useUnifiedTopology: true
    });
    console.log("Connected correctly to server");
    db = client.db(DB_NAME);
    col = db.collection(collection);
    await col.createIndex({ startTime: 1 });
    console.log("Collection indexed");
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
  },
  async findByDateRange(start, end) {
    const results = await col.find({ startTime: { $gte: start, $lt: end } });
    return results.toArray();
  }
};

/*

    */

/*
db.Collection.find({
    created_at : {
        '$gte': new Timestamp(new Date(2012, 0, 21), 0),
        '$lte': new Timestamp(new Date(2012, 0, 22), 0)
    }
})
*/
