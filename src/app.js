//app.js to export the app ready for integration testing

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const {v4:uuid} = require('uuid');
const bookmarksRouter = require('./bookmarks/bookmarks-router');
const logger = require('./logger');
const validateBearerToken = require('./validate-bearer-token');

const app = express();

const morganOption = (process.env.NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use(validateBearerToken);

app.use(function errorHandler(error, req, res, next) {
  let response
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } }
  } else {
    console.error(error)
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})


app.use('/api', bookmarksRouter);


app.get('/', (req, res) => {
  res.send('Hello, world!')
})

module.exports = app;