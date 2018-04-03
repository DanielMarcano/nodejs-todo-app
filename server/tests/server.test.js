const expect = require('expect');
const request = require('supertest');
const _ = require('lodash');

const { ObjectID } = require('mongodb');
// const { app } = require('../server');
const rewire = require('rewire');
const appModule = rewire('../server');
const app = appModule.__get__('app');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');

let todos = [{
  _id: new ObjectID(),
  text: 'Go get a life'
}, {
  _id: new ObjectID(),
  text: 'Go write my first novel',
  completed: true,
  completedAt: 123
}];

beforeEach(done => {
  Todo.remove().then(() => {
    Todo.insertMany(todos).then(() => done(), done);
  });
});

describe('POST /todos', () => {
  it('should create a new todo', done => {
    let text = 'Do the laundry';
    appModule.__set__('showSomeshit', expect.createSpy());
    request(app)
      .post('/todos')
      .send({ text })
      .expect(201)
      .expect(res => {
        expect(appModule.__get__('showSomeshit')).toHaveBeenCalled();
      })
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
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {

  it('should return 404 when id is invalid', done => {
    request(app)
      .get('/todos/1')
      .expect(404)
      .end(done);
  });

  it('should return 404 when id is valid but not found', done => {
    request(app)
      .get(`/todos/${new ObjectID()}`)
      .expect(404)
      .end(done);
  });

  it('should return todo when id is valid', done => {

    request(app)
      .get(`/todos/${todos[0]._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toEqual(todos[0]._id);
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);

  });

});

describe('DELETE /todos/:id', () => {

  it('should return 404 when id is invalid', done => {
    request(app)
      .delete('/todos/1')
      .expect(404)
      .expect(res => {
        expect(res.body.error).toBe('Invalid id');
      })
      .end(done);
  });

  it('should return 404 when id is valid but not found', done => {
    request(app)
      .delete(`/todos/${new ObjectID()}`)
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
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toEqual(id);
        expect(res.body.todo.text).toBe(todos[0].text);
        expect(res.body.message).toBe('Todo was successfully removed');
      })
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById(res.body.todo._id).then(todo => {
          expect(todo).toNotExist();
          done();
        }).catch(done);
      });

  });
});

describe('PATCH /todos/:id', () => {

  it('should return 404 when id is invalid', done => {
    request(app)
      .patch('/todos/1')
      .expect(404)
      .expect(res => {
        expect(res.body.error).toBe('Invalid id');
      })
      .end(done);
  });

  it('should return 404 when id is valid but not found', done => {
    request(app)
      .patch(`/todos/${new ObjectID()}`)
      .expect(404)
      .expect(res => {
        expect(res.body.message).toBe('Todo not found');
      })
      .end(done);
  });

  it('should update the todo', done => {
    let todo = _.pick(todos[1], ['text', 'completed']);
    todo.text = 'This is my updated text';
    request(app)
      .patch(`/todos/${todos[1]._id}`)
      .send(todo)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.completedAt).toNotBe(todos[1].completedAt).toExist();
        expect(res.body.todo.completed).toBe(todos[1].completed);
        expect(res.body.message).toBe('Todo was successfully updated');
      })
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById(todos[1]._id).then(doc => {
          expect(doc.completedAt).toNotBe(null);
          expect(doc.text).toBe(todo.text);
          expect(doc.completedAt).toNotBe(todos[1].completedAt).toBeA('number');
          done();
        }).catch(done);
      });
  });

  it('should clear completedAt when todo is not completed', done => {
    let todo = _.pick(todos[1], ['text', 'completed']);
    todo.completed = false;
    request(app)
      .patch(`/todos/${todos[1]._id}`)
      .send(todo)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.completedAt).toNotExist();
        expect(res.body.message).toBe('Todo was successfully updated');
      })
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById(todos[1]._id).then(doc => {
          expect(doc.completedAt).toNotExist();
          expect(doc.text).toBe(todo.text);
          expect(doc.completedAt).toNotBe(todos[1].completedAt);
          done();
        }).catch(done);
      });
  });

});