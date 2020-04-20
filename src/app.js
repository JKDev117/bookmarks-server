//app.js to export the app ready for integration testing

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const {v4:uuid} = require('uuid');
const bookmarksRouter = require('./bookmarks/bookmarks-router');
const logger = require('./logger');

const app = express();

const morganOption = (process.env.NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());


app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization')

  if(!authToken || authToken.split(' ')[1] !== apiToken){
    logger.error(`Unauthorized request to path: ${req.path}`);
  }
  next();  
});



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

app.use(bookmarksRouter);

app.get('/', (req, res) => {
  res.send('Hello, world!')
})

module.exports = app;