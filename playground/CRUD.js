const { MongoClient, ObjectID } = require('mongodb');
const assert = require('assert');

MongoClient.connect('mongodb://localhost:27017', (err, client) => {
  const db = client.db('TodoApp');
  findUsers(db, 2, showResult);
  client.close();
});

let insertUser = (db, callback) => {
  let collection = returnCollection(db, 'users');
  collection.insertOne({name: 'Daniel', age: 21, location: 'Barcelona, Spain'}, (err, result) => {
    assert.equal(null, err);
    assert.equal(1, result.ops.length);
    callback(`The user was successfully added`);
  });
};

let showResult = result => console.log(`${JSON.stringify(result, null, 2)}`);

let deleteUser = (db, callback) => {
  let collection = returnCollection(db, 'users');
  collection.deleteOne({name: 'Daniel'}, (err, result) => {
    assert.equal(1, result.deletedCount, 'Cannot delete user');
    callback('The user was successfully deleted');
  });
};

let updateUser = (db, callback) => {
  let collection = returnCollection(db, 'users');
  collection.updateOne({ name: 'Daniel' }, { $set: { age: 25 } }, (err, result) => {
    assert.equal(null, err);
    assert.notEqual(0, result.modifiedCount, 'User was not updated');
    callback('User was successfully updated');
  });
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
