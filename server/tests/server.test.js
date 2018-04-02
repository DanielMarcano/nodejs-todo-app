const expect = require("expect");
const request = require("supertest");

const { app } = require("../server");
const { Todo } = require("../models/todo");
const { User } = require("../models/user");

let todos = [{
  text: "Go buy some weed"
}, {
  text: "Go clean my room"
}];

beforeEach(done => {
  Todo.remove().then(() => {
    Todo.insertMany(todos).then(() => done(), done);
  });
});

describe("POST /todos", () => {
  it("should create a new todo", done => {
    let text = "Do the laundry";
    request(app)
      .post("/todos")
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

  it("should not create todo with invalid body data", done => {
    request(app)
      .post("/todos")
      .send()
      .expect(400)
      .expect(res => {
        expect(res.text).toMatch(new RegExp("^Todo validation failed"));
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

describe("GET /todos", () => {
  it("should fetch all todos", done => {
    request(app)
      .get("/todos")
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});