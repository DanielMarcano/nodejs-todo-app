const rewire = require('rewire');
const appModule = rewire('../server');
const app = appModule.__get__('app');
const expect = require('expect');
const request = require('supertest');
const _ = require('lodash');

const { ObjectID } = require('mongodb');
const { todos, populateTodos, users, populateUsers } = require('./seed/seed');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');

beforeEach(populateTodos);
beforeEach(populateUsers);

describe('POST /todos', () => {
  it('should create a new todo', done => {
    let text = 'Do the laundry';
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({ text })
      .expect(201)
      .expect(res => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) return done(err);

        Todo.find({ text })
          .then(todos => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch(done);
      });
  });

  it('should not create todo with invalid body data', done => {
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send()
      .expect(400)
      .expect(res => {
        expect(res.text).toMatch(new RegExp('^Todo validation failed'));
      })
      .end((err, res) => {
        if (err) return done(err);

        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch(done);
      });
  });
});

describe('GET /todos', () => {
  it('should fetch all todos', done => {
    request(app)
      .get('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {

  it('should return 400 when id is invalid', done => {
    request(app)
      .get('/todos/1')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 when id is valid but not found', done => {
    request(app)
      .get(`/todos/${new ObjectID()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(400)
      .end(done);
  });

  it('should return todo when id is valid', done => {

    request(app)
      .get(`/todos/${todos[0]._id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toEqual(todos[0]._id.toHexString());
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);

  });

  it('should not return todo created by other user', done => {

    request(app)
      .get(`/todos/${todos[0]._id}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(400)
      .end(done);

  });

});

describe('DELETE /todos/:id', () => {

  it('should return 404 when id is invalid', done => {
    request(app)
      .delete('/todos/1')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .expect(res => {
        expect(res.body.error).toBe('Invalid id');
      })
      .end(done);
  });

  it('should return 404 when id is valid but not found', done => {
    request(app)
      .delete(`/todos/${new ObjectID()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .expect(res => {
        expect(res.body.message).toBe('Todo not found');
      })
      .end(done);
  });

  it('should return todo when it is found and deleted', done => {

    let id = todos[0]._id;

    request(app)
      .delete(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toEqual(id.toHexString());
        expect(res.body.todo.text).toBe(todos[0].text);
        expect(res.body.message).toBe('Todo was successfully removed');
      })
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById(res.body.todo._id).then(todo => {
          expect(todo).toBeFalsy();
          done();
        }).catch(done);
      });

  });

  it('should not delete todo created by another user', done => {

    let id = todos[0]._id;

    request(app)
      .delete(`/todos/${id}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

});

describe('PATCH /todos/:id', () => {

  it('should return 404 when id is invalid', done => {
    request(app)
      .patch('/todos/1')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .expect(res => {
        expect(res.body.error).toBe('Invalid id');
      })
      .end(done);
  });

  it('should return 404 when id is valid but not found', done => {
    request(app)
      .patch(`/todos/${new ObjectID()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .expect(res => {
        expect(res.body.message).toBe('Todo not found');
      })
      .end(done);
  });

  it('should update the todo', done => {
    let todo = _.pick(todos[0], ['text', 'completed']);
    todo.text = 'This is my updated text';
    request(app)
      .patch(`/todos/${todos[0]._id}`)
      .set('x-auth', users[0].tokens[0].token)
      .send(todo)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).not.toBe(todos[0].text);
        expect(res.body.message).toBe('Todo was successfully updated');
      })
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById(todos[0]._id).then(doc => {
          if (!doc) throw new Error('Todo not found');
          expect(doc.text).toBe(todo.text);
          expect(doc._creator).toEqual(users[0]._id);
          done();
        }).catch(done);
      });
  });

  it('should clear completedAt when todo is not completed', done => {
    let todo = _.pick(todos[1], ['text', 'completed']);
    todo.completed = false;
    request(app)
      .patch(`/todos/${todos[1]._id}`)
      .set('x-auth', users[1].tokens[0].token)
      .send(todo)

      .expect(res => {
        expect(res.body.todo.completedAt).toBeNull();
        expect(res.body.message).toBe('Todo was successfully updated');
      })
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById(todos[1]._id).then(doc => {
          expect(doc.completed).toBeFalsy();
          expect(doc.text).toBe(todo.text);
          expect(doc.completedAt).toBeNull();
          done();
        }).catch(done);
      });
  });

  it('should not update todo created by another user', done => {
    let todo = _.pick(todos[0], ['text', 'completed']);
    todo.text = 'This is my updated text';
    request(app)
      .patch(`/todos/${todos[0]._id}`)
      .set('x-auth', users[1].tokens[0].token)
      .send(todo)
      .expect(404)
      .end(done);
  });

});

describe('POST /users', () => {
  it('should create a new user', done => {
    let newUser = {
      email: 'marceline@adv.com',
      password: '123456'
    };

    request(app)
      .post('/users')
      .send(newUser)
      .expect(201)
      .expect(res => {
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body).toMatchObject({ '_id': expect.any(String), 'email': expect.any(String) });
        expect(res.body.email).toEqual(newUser.email);
      })
      .end((err) => {
        if (err) return done(err);
        User.findOne({ email: newUser.email }).then(user => {
          expect(user).toBeTruthy();
          expect(user.password).not.toBe(newUser.password);
          done();
        }).catch(done);
      });
  });

  it('should not create a new user with invalid password', done => {
    let user = {
      email: 'marceline@adv.com',
      password: '12345'
    };

    request(app)
      .post('/users')
      .send(user)
      .expect(400)
      .expect(res => {
        expect(res.body).toMatchObject({ 'error': expect.any(String) });
        expect(res.body.error).toMatch(new RegExp('^User validation failed'));
      })
      .end(done);
  });

  it('should not create a new user with used email', done => {
    let user = {
      email: users[1].email,
      password: '123456'
    };

    request(app)
      .post('/users')
      .send(user)
      .expect(400)
      .expect(res => {
        expect(res.body).toMatchObject({ 'error': expect.any(String) });
        expect(res.body.error).toMatch(new RegExp('duplicate key error'));
      })
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should retrieve user info', done => {

    let id = users[0]['_id'];
    let email = users[0]['email'];

    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body).toMatchObject({
          '_id': expect.stringMatching(users[0]._id.toHexString()),
          'email': expect.stringMatching(users[0].email)
        });
      })
      .end(done);
  });
});

it('should not retrieve user info', done => {

  request(app)
    .get('/users/me')
    .expect(401)
    .expect(res => {
      expect(res.body.error).toEqual(
        expect.objectContaining({ name: expect.any(String), message: 'jwt must be provided' })
      );
    })
    .end(done);
});

describe('POST /users/login', () => {
  it('should login user and return x-auth header', done => {
    request(app)
      .post('/users/login')
      .send(users[1])
      .expect(200)
      .expect(res => {
        expect(res.header['x-auth']).toBeTruthy();
      })
      .end((err, res) => {
        if (err) return done(err);
        User.findById(users[1]._id)
          .then(user => {
            expect(user.tokens[0]).toMatchObject({
              access: 'auth',
              token: res.header['x-auth']
            });
            expect(user.tokens.length).toBe(2);
            done();
          }).catch(done);
      });
  });
  it('should not login user with wrong password nor return x-auth header', done => {
    let user = users[1];
    user.password = 'webbitt';
    request(app)
      .post('/users/login')
      .send(user)
      .expect(400)
      .expect(res => {
        expect(res.header['x-auth']).toBeFalsy();
      })
      .end(done);
  });
});

describe('DELETE /users/me/token', () => {
  it('should delete the token of the user', done => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        User.findById(users[0]._id)
          .then(user => {
            if (!user) return done(new Error('User not found'));
            expect(user.tokens[0]).toBeFalsy();
            done();
          }).catch(done);
      });
  });

  it('should not delete the token of the user', done => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token + 'b')
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        User.findById(users[0]._id)
          .then(user => {
            if (!user) return done(new Error('User not found'));
            expect(user.tokens[0]).toMatchObject({
              access: 'auth',
              token: users[0].tokens[0].token
            });
            done();
          }).catch(done);
      });
  });
});