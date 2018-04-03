const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let password = 'cookies from hell';

bcrypt.genSalt(10, (err, salt) => {
  bcrypt.hash(password, salt, (err, hash) => {
    console.log(hash);
    console.log(bcrypt.compareSync(password, hash));
  });
});