var MongoClient = require('mongodb').MongoClient;
var uri = 'mongodb+srv://ESN2020OBA:' + process.env.MONGO_PW + '@eenstukjenostalgie-cskbi.mongodb.net/test?retryWrites=true&w=majority';
var client = new MongoClient(uri, { useUnifiedTopology: true });

const database = {
  open: function () {
    client.connect(err => {
      if (err) throw err;
      var db = client.db('eenstukjenostalgie');
      db.createCollection('stories', (err, result) => {
        if (err) throw err;
        console.log('collection created');
        client.close();
      });
    });
  }
};

module.exports = database;
