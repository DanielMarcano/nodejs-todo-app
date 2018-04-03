const env = process.env.NODE_ENV || 'development';

if (env === 'test' || env === 'development') {
  let config = require('./config.json');
  let configEnv = config[env];
  Object.keys(configEnv).forEach(key => {
    process.env[key] = configEnv[key];
  });
}

// case 'production':
//   process.env.MONGODB_URL = 'mongodb://dbdan:123456@ds231529.mlab.com:31529/todo-app';
//   break;