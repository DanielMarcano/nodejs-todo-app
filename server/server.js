require('./config/config');
const express = require('express');
const _ = require('lodash');
const { authenticate } = require('./middleware/authenticate');

const { ObjectID } = require('mongodb');
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT;

const showSomeshit = someshit => console.log(someshit);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app
  .post('/todos', authenticate, (req, res) => {
    let todo = new Todo({
      text: req.body.text,
      _creator: req.user._id
    });
    todo.save()
      .then(
        doc => res.status(201).send(doc))
      .catch(e => res.status(400).send(e.message));
  })
  .get('/todos', authenticate, (req, res) => {
    Todo.find({
        _creator: req.user._id
      })
      .then(
        todos => res.status(200).send({ todos }))
      .catch(e => res.status(400).send());
  })
  .get('/todos/:id', authenticate, (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });
    Todo.findOne({
        _id: id,
        _creator: req.user._id
      })
      .then(todo => {
        if (!todo) throw new Error('Todo not found');
        res.status(200).json({ todo });
      }).catch(e => res.status(400).send(e.message));
  })
  .delete('/todos/:id', authenticate, (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });
    Todo.findOneAndRemove({
      _id: id,
      _creator: req.user._id
    }).then(todo => {
      if (!todo) return res.status(404).json({ message: 'Todo not found' });
      res.status(200).json({ todo, message: 'Todo was successfully removed' });
    }).catch(e => res.status(400).send());
  })
  .patch('/todos/:id', authenticate, (req, res) => {
    let id = req.params.id;

    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });

    let body = _.pick(req.body, ['text', 'completed']);

    if (body.completed === true) {
      body.completedAt = new Date().getTime();
    } else {
      body.completed = false;
      body.completedAt = null;
    }

    Todo.findOneAndUpdate({ _id: id, _creator: req.user._id }, body, { new: true }).then(todo => {
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
      .then(token => res.header('x-auth', token).status(201).send(user))
      .catch(e => res.status(400).send({ error: e.message }));
  })
  .get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
  })
  .post('/users/login', (req, res) => {
    let body = _.pick(req.body, ['email', 'password']);
    User.findByCredentials(body)
      .then(user => {
        user.generateAuthToken()
          .then(token => res.header('x-auth', token).status(200).send({ user }));
      })
      .catch(e => res.status(400).send({ error: e }));

  })
  .delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token)
      .then(() => {
        res.status(200).send();
      }, () => {
        res.status(400).send();
      });
  })
  .listen(port, () => console.log(`Server up and running at ${port}`));

module.exports = { app };