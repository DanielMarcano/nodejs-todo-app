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

UserSchema.statics.findByCredentials = async function({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');

  const result = await bcrypt.compare(password, user.password);
  if (!result) throw new Error('Password does not match');

  return user;
};

UserSchema.statics.findByToken = function(token) {

  let decode;

  try {
    decode = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    throw e;
  }
  return this.findOne({
    _id: decode._id,
    'tokens.token': token,
    'tokens.access': decode.access
  });
};

UserSchema.methods.toJSON = function() {
  let user = this.toObject();
  return _.pick(user, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = async function() {
  const user = this;
  const access = 'auth';
  const token = jwt.sign({ _id: user._id, access }, process.env.JWT_SECRET).toString();
  user.tokens = user.tokens.concat([{ token, access }]);
  await user.save();
  return user.tokens[0].token;
};

UserSchema.methods.removeToken = async function(token) {
  await this.update({
    $pull: {
      tokens: { token }
    }
  });
};

UserSchema.pre('save', async function(next) {

  if (this.isModified('password')) {
    try {
      const password = this.password;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      this.password = hash;
      next();
    } catch (e) {
      throw new Error(e);
    }
  } else {
    next();
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = { User };