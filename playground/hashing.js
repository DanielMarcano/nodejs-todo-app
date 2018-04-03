const jwt = require('jsonwebtoken');

let data = {
  id: 5
};

let token = jwt.sign(data, 'mydirtylittlesecret');

console.log(token);