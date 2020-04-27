//app.js to export the app ready for integration testing

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const {v4:uuid} = require('uuid');
const bookmarksRouter = require('./bookmarks/bookmarks-router');
const logger = require('./logger');
const BookmarksService = require('./bookmarks-service');

const app = express();
const jsonParser = express.json()

const morganOption = (process.env.NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

/*
app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization')

  if(!authToken || authToken.split(' ')[1] !== apiToken){
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({error: 'Unauthorized request'});
  }
  next();  
});
*/


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

/*
app.use(bookmarksRouter);
*/

//GET /bookmarks
app.get('/bookmarks', (req, res, next) => {
  const knexInstance = req.app.get('db')
  BookmarksService.getAllBookmarks(knexInstance)
    .then(bookmarks => {
      res.json(bookmarks)
    })
    .catch(next) //passing next into the .catch from the promise chain so that any errors get handled by our error handler middleware
})

//GET /bookmarks/:bookmark_id
app.get('/bookmarks/:bookmark_id', (req,res,next) => {
  const knexInstance = req.app.get('db')
  BookmarksService.getById(knexInstance, req.params.bookmark_id)
    .then(bookmark => {
      if(!bookmark){
        return res.status(404).json({
          error:{message: "Bookmark doesn't exist"}
        })
      }
      res.json(bookmark)
    })
    .catch(next)
})

//POST /bookmarks
app.post('/bookmarks', jsonParser, (req,res,next) => {
  const { title, url, description, rating } = req.body;
  const newBookmark = { title, url, description, rating }
  BookmarksService.insertBookmark(
    req.app.get('db'),
    newBookmark
  )
    .then(bookmark => {
      res.status(201)
         .location(`/bookmarks/${bookmark.id}`)
         .json(bookmark)
    })
    .catch(next)
})


app.get('/', (req, res) => {
  res.send('Hello, world!')
})

module.exports = app;