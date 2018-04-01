const mongoose = require('mongoose');

const User = mongoose.model('User', {
  email: {
    type: String,
    minLength: 1,
    trim: true,
    match: [new RegExp('^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$'), 'Please fill a valid email address'],
    required: true
  }
});

module.exports = { User };
