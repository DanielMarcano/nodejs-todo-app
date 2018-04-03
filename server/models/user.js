const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const _ = require('lodash');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    minLength: 1,
    trim: true,
    required: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    required: true,
    type: String,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

UserSchema.statics.findByCredentials = function({ email, password }) {
  return User.findOne({ email })
    .then(user => {
      if (!user) return Promise.reject('User not found');
      return bcrypt.compare(password, user.password)
        .then(result => {
          if (!result) return Promise.reject('Password does not match');
          return user;
        });
    });
};

UserSchema.statics.findByToken = function(token) {

  let decode;

  try {
    decode = jwt.verify(token, 'abc123');
  } catch (e) {
    return Promise.reject(e);
  }
  return this.findOne({
    '_id': decode._id,
    'tokens.token': token,
    'tokens.access': decode.access
  });
};

UserSchema.methods.toJSON = function() {
  let user = this.toObject();
  return _.pick(user, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function() {
  let user = this;
  let access = 'auth';
  let token = jwt.sign({ _id: user._id, access }, 'abc123').toString();
  user.tokens = user.tokens.concat([{ token, access }]);
  return user.save().then(() => token);
};

UserSchema.methods.removeToken = function(token) {
  return this.update({
    $pull: {
      tokens: { token }
    }
  });
};



UserSchema.pre('save', function(next) {

  if (this.isModified('password')) {
    let password = this.password;
    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw new Error(err);
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) throw new Error(err);
        this.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = { User };