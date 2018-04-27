require('./config/config');
const asyncHandler = require('express-async-handler');
const express = require('express');
const _ = require('lodash');
const { authenticate } = require('./middleware/authenticate');
console.error('A unicorn got in');

const { ObjectID } = require('mongodb');
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app
  .post('/todos', authenticate, asyncHandler(async (req, res) => {
    const todo = new Todo({
      text: req.body.text,
      _creator: req.user._id
    });

    await todo.save();
    res.status(201).send(todo);
  }))
  .get('/todos', authenticate, asyncHandler(async (req, res) => {
    const todos = await Todo.find({ _creator: req.user._id });
    res.status(200).send({ todos });
  }))
  .get('/todos/:id', authenticate, asyncHandler(async (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });

    const todo = await Todo.findOne({ _id: id, _creator: req.user._id });
    if (!todo) throw new Error('Todo not found.');
    res.status(200).json({ todo });
  }))
  .delete('/todos/:id', authenticate, asyncHandler(async (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });

    const todo = await Todo.findOneAndRemove({ _id: id, _creator: req.user._id });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    res.status(200).json({ todo, message: 'Todo was successfully removed' });
  }))
  .patch('/todos/:id', authenticate, asyncHandler(async (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(404).json({ error: 'Invalid id' });

    let body = _.pick(req.body, ['text', 'completed']);

    if (body.completed === true) {
      body.completedAt = new Date().getTime();
    } else {
      body.completed = false;
      body.completedAt = null;
    }

    const todo = await Todo.findOneAndUpdate({ _id: id, _creator: req.user._id }, body, { new: true });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    res.status(200).json({ todo, message: 'Todo was successfully updated' });
  }))
  .get('/', (req, res) => {
    res.status(200).send('Hello there');
  })
  .post('/users', asyncHandler(async (req, res) => {
    let body = _.pick(req.body, ['email', 'password']);
    let user = new User(body);
    await user.save();

    const token = await user.generateAuthToken();
    res.header('x-auth', token).status(201).send(user);
  }))
  .get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
  })
  .post('/users/login', asyncHandler(async (req, res) => {
    let body = _.pick(req.body, ['email', 'password']);

    const user = await User.findByCredentials(body);
    const token = await user.generateAuthToken();
    res.header('x-auth', token).status(200).send({ user });
  }))
  .delete('/users/me/token', authenticate, asyncHandler(async (req, res) => {
    await req.user.removeToken(req.token);
    res.status(200).send();
  }))
  .use((err, req, res, next) => {
    if (err.name === 'JsonWebTokenError') {
      res.status(401).send({ error: err });
    } else {
      res.status(500).send(err.message);
    }

  })
  .listen(port, () => console.log(`Server up and running at ${port}`));

module.exports = { app };