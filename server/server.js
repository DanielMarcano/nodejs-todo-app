require('./config/config');
const express = require('express');
const _ = require('lodash');

const { ObjectID } = require('mongodb');
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();
const port = process.env.PORT;

const showSomeshit = someshit => console.log(someshit);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app
  .post('/todos', (req, res) => {
    showSomeshit('hello');
    let todo = new Todo({
      text: req.body.text
    });
    todo.save()
      .then(
        doc => res.status(201).send(doc))
      .catch(e => res.status(400).send(e.message));
  })
  .get('/todos', (req, res) => {
    Todo.find()
      .then(
        todos => res.status(200).send({ todos }))
      .catch(e => res.status(400).send());
  })
  .get('/todos/:id', (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });
    Todo.findById(id).then(todo => {
      if (!todo) return res.status(404).json({ message: 'Todo not found' });
      res.status(200).json({ todo });
    }).catch(e => res.status(400).send());
  })
  .delete('/todos/:id', (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });
    Todo.findByIdAndRemove(id).then(todo => {
      if (!todo) return res.status(404).json({ message: 'Todo not found' });
      res.status(200).json({ todo, message: 'Todo was successfully removed' });
    }).catch(e => res.status(400).send());
  })
  .patch('/todos/:id', (req, res) => {
    let id = req.params.id;

    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });

    let body = _.pick(req.body, ['text', 'completed']);

    if (body.completed === true) {
      body.completedAt = new Date().getTime();
    } else {
      body.completed = false;
      body.completedAt = null;
    }

    Todo.findByIdAndUpdate(id, body, { new: true }).then(todo => {
      if (!todo) return res.status(404).json({ message: 'Todo not found' });
      res.status(200).json({ todo, message: 'Todo was successfully updated' });
    }).catch(e => res.status(400).send());
  })
  .get('/', (req, res) => {
    res.status(200).send('Hello there');
  })
  .post('/users', (req, res) => {
    let body = _.pick(req.body, ['email', 'password']);
    let user = new User(body);
    user.save()
      .then(() => user.generateAuthToken())
      .then(token => res.header('x-auth', token).send(user))
      .catch(e => res.status(400).send({ error: e.message }));
  })
  .listen(port, () => console.log(`Server up and running at ${port}`));

module.exports = { app };