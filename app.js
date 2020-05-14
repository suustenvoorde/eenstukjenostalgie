var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var routes = require('./routes');
var session = require('express-session')({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
});

// Setup .env file:
require('dotenv').config({ path: 'vars.env' });

// Testing database:
var database = require('./controllers/database.js');
database.open();

// view engine setup:
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public', { dotfiles: 'allow'}));
app.use(session);

// Use routes:
app.use('/', routes);

// Run:
app.listen(process.env.PORT, () => {
  console.log('runs on port ' + process.env.PORT);
});
