const express = require('express');
const bodyParser = require('body-parser');

const { ObjectID } = require('mongodb');
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app
  .post('/todos', (req, res) => {
    let todo = new Todo({
      text: req.body.text
    });
    todo.save()
      .then(
        doc => res.status(201).send(doc),
        e => res.status(400).send(e.message)
      );
  })
  .get('/todos', (req, res) => {
    Todo.find()
      .then(
        todos => res.status(200).send({ todos }),
        e => res.status(400).send()
      );
  })
  .get('/todos/:id', (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });
    Todo.findById(id).then(todo => {
      if (!todo) return res.status(404).json({ message: 'Todo could not be found' });
      res.status(200).json({ todo });
    }, e => res.status(400).send());
  })
  .delete('/todos/:id', (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });
    Todo.findByIdAndRemove(id).then(todo => {
      if (!todo) return res.status(404).json({ message: 'Todo not found' });
      res.status(200).json({ todo, message: 'The todo was removed successfully' });
    }, e => res.status(400).send());
  })
  .listen(port, () => console.log(`Server up and running at ${port}`));

module.exports = { app };