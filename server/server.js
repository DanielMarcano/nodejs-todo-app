const express = require('express');
const bodyParser = require('body-parser');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();
const port = process.env.PORT | 3000;

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.post('/todos', (req, res, next) => {
  let todo = new Todo({
    text: req.body.text
  });
  todo.save().then(doc => res.status(201).send(doc), e => res.status(400).send(e.message));
})
  .listen(port, () => console.log(`Server up and running at ${port}`));

module.exports = { app };
