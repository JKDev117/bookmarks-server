const path = require('path')
const express = require('express')
const xss = require('xss') //sanitizing tool
const BookmarksService = require('./bookmarks-service')
const { isWebUri } = require('valid-url');
const logger = require('../logger')

const bookmarksRouter = express.Router()
const jsonParser = express.json()

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description),
    rating: bookmark.rating
})



bookmarksRouter
    .route('/api/bookmarks') // ----------------------------------------------------------------// 
    //GET
    .get((req,res,next) => {
        BookmarksService.getAllBookmarks(
            req.app.get('db')
        )
            .then(bookmarks => {
                res.json(bookmarks.map(bookmark => serializeBookmark(bookmark)))
                //console.log(res.json())
                //res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })
    //POST
    .post(jsonParser, (req,res,next) => {
        const { title, url, description, rating} = req.body;

        const newBookmark = { title, url, description, rating }

        for(const [key, value] of Object.entries(newBookmark)){
            if(value==null){
                logger.error(`Missing '${key}' in request body`)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }
        
        if(!Number.isInteger(rating) || rating < 1 || rating > 5){
            logger.error(`Rating must be a number 1-5`)
            return res
                .status(400)
                .json({
                    error: { message: `Rating must be a number 1-5`}
                })
        }

        if(!isWebUri(url)){
            logger.error(`url must be a valid URL`)
            return res
                .status(400)
                .json({
                    error: { message: `url must be a valid URL`}
                })
        }
        
        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res.status(201)
                   .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                   .json(serializeBookmark(bookmark))
            })
            .catch(next)
    })



bookmarksRouter
    .route(`/api/bookmarks/:bookmark_id`) // -----------------------------------------------------------// 
    //ALL
    .all((req,res,next) => {
        BookmarksService.getById(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(bookmark => {
                if(!bookmark) {
                    logger.error(`Bookmark doesn't exist!`)
                    return res.status(404).json({
                        error: {message: `Bookmark doesn't exist!`}
                    })
                }
                res.bookmark = bookmark //save the bookmark for the next middleware
                next() //don't forget to call next so the next middleware happens
            })
            .catch(next)
    })
    //GET
    .get((req,res,next) => {
        res.json({
            id: res.bookmark.id,
            title: xss(res.bookmark.title),
            url: xss(res.bookmark.url),
            description: xss(res.bookmark.description),
            rating: res.bookmark.rating
        })
    })
    //DELETE
    .delete((req,res,next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    //PATCH
    .patch(jsonParser, (req, res, next) => {
          
          const { title, url, description, rating } = req.body
          const bookmarkToUpdate = { title, url, description, rating }
          
          const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
               if (numberOfValues === 0) {
                 logger.error(`Request body must contain either 'title', 'url', 'description' or 'rating'`)
                 return res.status(400).json({
                   error: {
                     message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
                   }
                 })
               }
          
          if(rating!=undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)){
              logger.error(`Rating must be a number 1-5`)
              return res
                  .status(400)
                  .json({
                  error: { message: `Rating must be a number 1-5`}
              })
          }
          
          if(url!=undefined && !isWebUri(url)){
              logger.error(`url must be a valid URL`)
              return res
              .status(400)
              .json({
                  error: { message: `url must be a valid URL`}
              })
          }
           
          BookmarksService.updateBookmark(
            req.app.get('db'),
            req.params.bookmark_id,
            bookmarkToUpdate
          )
            .then(numRowsAffected => {
              res.status(204).end()
            })
            .catch(next)
     })



module.exports = bookmarksRouter

/*

{
    "title": "Bookmark Title",
    "url": "http://www.website.com",
    "description": "",
    "rating": 4
}

*/