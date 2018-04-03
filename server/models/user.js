const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
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

const User = mongoose.model('User', UserSchema);

module.exports = { User };