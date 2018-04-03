const { User } = require('../models/user');

exports.authenticate = (req, res, next) => {
  let token = req.header('x-auth');
  User.findByToken(token)
    .then(user => {
      if (!user) return Promise.reject({ message: 'User was not found' });
      req.token = token;
      req.user = user;
      next();
    })
    .catch(e => res.status(401).send({ error: e.message }));
};