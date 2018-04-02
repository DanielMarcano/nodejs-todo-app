const expect = require('expect');
const request = require('supertest');

const { app } = require('../server');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');

beforeEach(done => {
  Todo.remove().then(() => done()).catch(done);
});

describe('POST /todos', () => {

  it('should create a new todo', done => {
    let text = 'Do the laundry';
    request(app)
      .post('/todos')
      .send({ text })
      .expect(201)
      .expect(res => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) return done(err);

        Todo.find().then(todos => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch(done);
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

        Todo.find().then(todos => {
          expect(todos.length).toBe(0);
          expect(todos[0]).toBeAn('undefined');
          done();
        }).catch(done);
      });
  });

});
