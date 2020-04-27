const express = require('express')
const xss = require('xss') //sanitizing tool
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const jsonParser = express.json()

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description),
    rating: bookmark.rating
})


//Route '/'
bookmarksRouter
    .route('/bookmarks')
    //GET
    .get((req,res,next) => {
        BookmarksService.getAllBookmarks(
            req.app.get('db')
        )
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
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
                   .json(serializeBookmark(bookmark))
            })
            .catch(next)
    })


//Route '/:bookmark_id
bookmarksRouter
    .route(`/bookmarks/:bookmark_id`)
    .all((req,res,next) => {
        BookmarksService.getById(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(bookmark => {
                if(!bookmark) {
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


    module.exports = bookmarksRouter

