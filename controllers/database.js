require('dotenv').config({ path: 'vars.env' });
var MongoClient = require('mongodb').MongoClient;
var uri = 'mongodb+srv://ESN2020OBA:' + process.env.MONGO_PW + '@eenstukjenostalgie-cskbi.mongodb.net/test?retryWrites=true&w=majority';
var client = new MongoClient(uri, { useUnifiedTopology: true });

const database = {
  open: function () {
    client.connect(err => {
      if (err) throw err;
      this.db = client.db('eenstukjenostalgie');
      this.collection = this.db.collection('stories');
      console.log('connected to database');
    });
  },
  addItem: async function (item) {
    return await this.collection.insertOne(item)
      .then(result => console.log('item added'))
      .catch(err => console.log(err));
  },
  getItem: async function (id) {
    return await this.collection.findOne()
      .then(result => {
        return result;
      })
      .catch(err => console.log(err));
  }
};

module.exports = database;
