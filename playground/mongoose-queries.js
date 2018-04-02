const mongoose = require('../server/db/mongoose');
const { User } = require("../server/models/user");

let id = '5ac0da726382b1a90a8c506e';

User.findById(id).then(user => {
  if (!user) return console.log('User not found');
  console.log(JSON.stringify(user, null, 2));
}).catch(e => console.log(e.message));