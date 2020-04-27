const express = require('express')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const jsonParser = express.json()

//Route '/'
bookmarksRouter
    .route('/bookmarks')
    //GET
    .get((req,res,next) => {
        BookmarksService.getAllBookmarks(
            req.app.get('db')
        )
            .then(bookmarks => {
                res.json(bookmarks)
            })
            .catch(next)
    })
    //POST
    .post(jsonParser, (req,res,next) => {
        const { title, url, description, rating} = req.body;
        const newBookmark = { title, url, description, rating }

        for(const [key, value] of Object.entries(newBookmark)){
            if(value==null){
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }

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


//Route '/:bookmark_id
bookmarksRouter
    .route(`/bookmarks/:bookmark_id`)
    //GET
    .get((req,res,next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getById(knexInstance, req.params.bookmark_id)
            .then(bookmark => {
                if(!bookmark){
                    return res.status(404).json({
                        error: {message: "Bookmark doesn't exist!"}
                    })
                } 
                res.json(bookmark)
            })
            .catch(next)
    })


    module.exports = bookmarksRouter

    