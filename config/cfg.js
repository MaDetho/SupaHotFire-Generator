var config = {};
config.mongodb = {};
config.http = {};

config.mongodb.host = 'ds229909.mlab.com';
config.mongodb.port = '29909';
config.mongodb.collection = 'supa_templates';
config.mongodb.user = 'mongo_user';
config.mongodb.pwd = '';
config.mongodb.uri = 'mongodb://' + config.mongodb.user + ':' + config.mongodb.pwd + '@' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.collection;

config.http.port = '8085';
config.http.domain = 'http://localhost:' + config.http.port;

module.exports = config;
