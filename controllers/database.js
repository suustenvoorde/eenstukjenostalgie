require('dotenv').config({ path: 'vars.env' });
var MongoClient = require('mongodb').MongoClient;
var uri = 'mongodb+srv://ESN2020OBA:' + process.env.MONGO_PW + '@eenstukjenostalgie-cskbi.mongodb.net/test?retryWrites=true&w=majority';
var client = new MongoClient(uri, { useUnifiedTopology: true });

const database = {
  open: function () {
    client.connect(err => {
      if (err) throw err;
      this.db = client.db('eenstukjenostalgie');

      // Create the stories collection:
      this.db.createCollection('stories');
      this.stories = this.db.collection('stories');

      // Create the photos collection:
      this.db.createCollection('photos');
      this.photos = this.db.collection('photos');
      console.log('connected to database');
    });
  },
  addItem: async function (collection, item) {
    return await collection.insertOne(item)
      .then(result => console.log('item added'))
      .catch(err => console.log(err));
  },
  getItem: async function (collection, id) {
    return await collection.findOne({ id: id })
      .then(result => result)
      .catch(err => console.log(err));
  }
};

module.exports = database;
