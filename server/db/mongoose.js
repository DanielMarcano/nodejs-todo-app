const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://dbdan:123456@ds231529.mlab.com:31529/todo-app');

module.exports = { mongoose };