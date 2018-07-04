const AWS = require('aws-sdk');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');

const {
    writeToDbMySql,
    writeToDbPassagesMySql
} = require('./mysql');

AWS.config.update({
    endpoint: 'https://dynamodb.eu-west-2.amazonaws.com',
    region: 'eu-west-2'
});

const {
    feetToMetres,
    metresToFeet,
    euclideanDistance,
    distFrom
  } = require('air-commons').utils;

const HOME_POSITION_COORDINATES = {
    latitude: 51.444137,
    longitude: -0.351227,
    elevation: 16
};

const TW_GREEN_COORDINATES = {
    latitude: 51.443874,
    longitude: -0.342588,
    elevation: 16
};

const WINDSOR_POSITION_COORDINATES = {
    latitude: 51.477180,
    longitude: -0.609712,
    elevation: 25
};

const AIRPORT_POSITION_COORDINATES = {
    latitude: 51.470022,
    longitude: -0.454295,
    elevation: 22
};

const AIRPORT_MIN_DISTANCE = 3200;

const MIN_SPEED = 60;
const MIN_HEIGHT = 250;
const MAX_HEIGHT = 2000;

const MIN_HEIGHT_ALL = 150;
const MAX_HEIGHT_ALL = 2000;

const MAX_DISTANCE_KM = (process.env.ENV_TYPE == 'development') ? 5 : 15;
const MIN_EUCLIDEAN_THRESHOLD_M = 4000;
const CALL_POLLING_TIME = 5000;

const distFromHome = (b) => distFrom(HOME_POSITION_COORDINATES, b);
const distFromAirport = (b) => distFrom(AIRPORT_POSITION_COORDINATES, b);
const minDistanceFromAirport = (b) => distFromAirport(b) >= AIRPORT_MIN_DISTANCE;
const withinRelevantHeight = (b) => b.galtM >= MIN_HEIGHT_ALL && b.galtM <= MAX_HEIGHT_ALL;




const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

const TABLE = process.env.TABLE_NAME;
const TABLE_PASSAGES = process.env.TABLE_NAME_FLIGHT_PASSAGES;

const writeToDb = (timestamp, icao, info, wind) => {
    var params = {
        TableName: TABLE,
        Item: {
            icao,
            timestamp,
            ...info,
            ...wind
        }
    };

    //console.log('Adding a new item...');
    docClient.put(params, (err, data) => {
        if (err) {
            console.error('Unable to add item. Error JSON:', JSON.stringify(err));
        } else {
            //console.log('Added item:', JSON.stringify(data));
        }
    });
};

const createTableToDb = () => {
    const params = {
        TableName: TABLE,
        KeySchema: [{
                AttributeName: 'icao',
                KeyType: 'HASH'
            }, //Partition key
            {
                AttributeName: 'timestamp',
                KeyType: 'RANGE'
            } //Sort key
        ],
        AttributeDefinitions: [{
                AttributeName: 'icao',
                AttributeType: 'S'
            },
            {
                AttributeName: 'timestamp',
                AttributeType: 'N'
            }

        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    };

    dynamodb.createTable(params, (err, data) => {
        if (err) {
            console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
        }
    });
};

const writeToDbPassages = (obj) => {
    var params = {
        TableName: TABLE_PASSAGES,
        Item: {
            ...obj
        }
    };

    docClient.put(params, (err, data) => {
        if (err) {
            console.error('Unable to add item. Error JSON:', JSON.stringify(err));
        } else {
            //console.log('Added item:', JSON.stringify(data));
        }
    });
};

const createTablePassagesToDb = () => {
    const params = {
        TableName: TABLE_PASSAGES,
        KeySchema: [{
                AttributeName: 'icao',
                KeyType: 'HASH'
            }, //Partition key
            {
                AttributeName: 'startTime',
                KeyType: 'RANGE'
            } //Sort key
        ],
        AttributeDefinitions: [{
                AttributeName: 'icao',
                AttributeType: 'S'
            },
            {
                AttributeName: 'startTime',
                AttributeType: 'N'
            }

        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    };

    dynamodb.createTable(params, (err, data) => {
        if (err) {
            console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
        }
    });
};

const initDb = () => {
    this.createTableToDb();
    this.createTablePassagesToDb();
}

var params = {
    TableName: TABLE
    /*
    FilterExpression: '#yr between :start_yr and :end_yr',
    ExpressionAttributeNames: {
        '#yr': 'year',
    },
    ExpressionAttributeValues: {
         ':start_yr': 1950,
         ':end_yr': 1959
    }
    */
};


let numItems = 0;
const fields = ['icao',
    'timestamp',
    'latitude',
    'longitude',
    'euclidean',
    'galtM'
];

/*
let allItems = [];
const json2csvParser = new Json2csvParser({
    fields
});
console.log('Scanning');
docClient.scan(params, onScan);
*/

async function onScan(err, data) {
    if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        console.log('Scan succeeded.');
        console.log(`Found ${data.Items.length} items`);

        let allItemsToWrite = data.Items;

        allItemsToWrite = allItemsToWrite.filter(withinRelevantHeight).filter(minDistanceFromAirport);
        allItemsToWrite = allItemsToWrite.filter(el => el.time < 1529248558000);


        console.log(`Filtered ${allItemsToWrite.length} items`);

        for(let itemToWrite of allItemsToWrite) {
            delete itemToWrite.timestamp;
            delete itemToWrite.wTimestamp;
            await writeToDbMySql(itemToWrite, {});
        }

        //allItems = allItems.concat(data.Items);
        numItems += data.Items.length;

        // continue scanning because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != 'undefined') {
            console.log('Scanning for more...');
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            //docClient.scan(params, onScan);
            setTimeout(() => {
                docClient.scan(params, onScan)
            }, 1000);
        } else {

            console.log(`Found ${numItems} items`);

            /*
            const csv = json2csvParser.parse(allItems);
            console.log(csv);
            fs.writeFile('./test.csv', csv, (err) => {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
            */
        }
    }
}

/*
function onScan(err, data) {
  if (err) {
    console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
  } else {
    console.log('Scan succeeded.');

    allItems = allItems.concat(data.Items);
    numItems += data.Items.length;

    // continue scanning because
    // scan can retrieve a maximum of 1MB of data
    if (typeof data.LastEvaluatedKey != 'undefined') {
      console.log('Scanning for more...');
      params.ExclusiveStartKey = data.LastEvaluatedKey;
      docClient.scan(params, onScan);
    } else {
      console.log(`Found ${numItems} items`);
    }
  }
}

const startScanning = () => {
  console.log('Scanning');
  docClient.scan(params, onScan);
};

const startQuerying = (from, to, callback) => {

  let itemsQuery = [];
  let numItemsQuery = 0;

  const paramsQuery = {
    TableName: TABLE,
    IndexName: "timestamp-index",
    KeyConditionExpression: "#timestamp BETWEEN :from and :to",
    ExpressionAttributeNames: {
      "#timestamp": "timestamp"
    },
    ExpressionAttributeValues: {
      ":from": from,
      ":to": to
    }
  };

  const runQuery = (callback) => {
    docClient.query(paramsQuery, (err, result) => {
      if (err) {
        //console.error('Unable to query the table. Error JSON:', JSON.stringify(err, null, 2));
        callback(err);
      } else {
        console.log('Query succeeded.');

        itemsQuery = itemsQuery.concat(result.Items);
        numItemsQuery += result.Items.length;

        if (typeof result.LastEvaluatedKey != 'undefined') {
          console.log('Querying for more...');
          paramsQuery.ExclusiveStartKey = result.LastEvaluatedKey;
          runQuery(callback);
        } else {
          console.log(`Found ${numItemsQuery} items`);
          callback(err, itemsQuery);
        }
      }
    });
  }

  console.log('Querying');
  runQuery(callback);
};

const startQueryingPromise = (from, to) => {
  return new Promise((resolve, reject) => {
    startQuerying(from, to, (err, data) => {
      if (err !== null) {
        return reject(err);
      }
      resolve(data);
    });
  });
};

exports.startScanning = startScanning;
exports.startQueryingPromise = startQueryingPromise;

*/


exports.writeToDb = writeToDb;
exports.createTableToDb = createTableToDb;
exports.writeToDbPassages = writeToDbPassages;
exports.createTablePassagesToDb = createTablePassagesToDb;
exports.initDb = initDb;
