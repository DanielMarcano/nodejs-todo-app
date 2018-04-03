const env = process.env.NODE_ENV || 'development';

switch (env) {
  case 'production':
    process.env.MONGODB_URL = 'mongodb://dbdan:123456@ds231529.mlab.com:31529/todo-app';
  case 'development':
    process.env.PORT = 3000;
    process.env.MONGODB_URL = 'mongodb://localhost:27017/TodoApp';
    break;
  case 'test':
    process.env.PORT = 3000;
    process.env.MONGODB_URL = 'mongodb://localhost:27017/TodoAppTest';
    break;
}