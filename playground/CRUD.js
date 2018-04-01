const { MongoClient, ObjectID } = require('mongodb');
const assert = require('assert');

MongoClient.connect('mongodb://localhost:27017', (err, client) => {
  const db = client.db('TodoApp');
  updateDoc(db, showResult);
  client.close();
});

let insertDoc = (db, callback) => {
  let collection = returnCollection(db, 'todos');
  collection.insertOne({text: 'Take the garbage out', completed: true}, (err, result) => {
    assert.equal(null, err);
    assert.equal(1, result.ops.length);
    callback(`The todo was successfully added`);
  });
};

let showResult = result => console.log(`${JSON.stringify(result, null, 2)}`);

let deleteDoc = (db, callback) => {
  let collection = returnCollection(db, 'users');
  collection.findOneAndDelete({ _id: new ObjectID("5abf905d72fcbd99d15fe4ef") }, (err, result) => {
    // console.log(err);
    // assert.equal(1, result.deletedCount, 'Cannot delete todo');
    console.log(result.value);
    callback('The user was successfully deleted');
  });

  // collection.deleteMany({completed: true}, (err, result) => {
  //   console.log(result);
  // });
};

let updateDoc = (db, callback) => {
  let collection = returnCollection(db, 'users');
  collection.findOneAndUpdate({ _id: new ObjectID("5abf907572fcbd99d15fe4f9") }, { $set: { name: 'The Fallen Witch' }, $inc: { age: 5 } }, { returnOriginal: false })
    .then(result => {
      console.log(result);
    }, showResult);
};

let findUser = (db, callback) => {
  let collection = returnCollection(db, 'users');
  collection.find({_id: new ObjectID('5abf7dda30635e63acb77599')}).toArray().then(docs => console.log(JSON.stringify(docs, null, 2)), err => console.log('Error', err));
};

let findUsers = (db, amount, callback) => {
  let collection = returnCollection(db, 'users');
  collection.find({ name: 'Daniel' }).count().then(count => prettyPrint(count));
};

let prettyPrint = value => console.log(JSON.stringify(value, null, 2));

let returnCollection = (db, name) => db.collection(name);
