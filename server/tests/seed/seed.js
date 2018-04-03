const { ObjectID } = require('mongodb');
const { Todo } = require('../../models/todo');
const { User } = require('../../models/user');
const jwt = require('jsonwebtoken');

let userOneId = new ObjectID();
let userTwoId = new ObjectID();

exports.todos = [{
  _id: new ObjectID(),
  text: 'Go get a life',
  _creator: userOneId
}, {
  _id: new ObjectID(),
  text: 'Go write my first novel',
  completed: true,
  completedAt: 123,
  _creator: userTwoId
}];

exports.populateTodos = done => {
  Todo.remove().then(() => {
    Todo.insertMany(this.todos).then(() => done(), done);
  });
};


exports.users = [{
    _id: userOneId,
    email: 'finn@adv.com',
    password: '123456',
    tokens: [{
      access: 'auth',
      token: jwt.sign({ _id: userOneId, access: 'auth' }, 'abc123').toString()
    }]
  },
  {
    _id: userTwoId,
    email: 'jake@adv.com',
    password: 'webinh',
    tokens: [{
      access: 'auth',
      token: jwt.sign({ _id: userTwoId, access: 'auth' }, 'abc123').toString()
    }]
  }
];

exports.populateUsers = done => {
  User.remove().then(() => {
    let userOne = new User(this.users[0]).save();
    let userTwo = new User(this.users[1]).save();
    return Promise.all([userOne, userTwo]);
  }).then(() => done());
};