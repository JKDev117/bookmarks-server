const knex = require('knex')
const app = require('../src/app')
const makeBookmarksArray = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })
    
    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks_tb').truncate())

    afterEach('cleanup', () => db('bookmarks_tb').truncate())
    
    /* ------------------------------------------------------------------------------- */

    //GET /bookmarks
    describe('GET /bookmarks', () => {
        context('Given no articles', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, [])
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();
            
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_tb')
                    .insert(testBookmarks)
            })
    
            it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, testBookmarks)
            })
        })
    }) //end GET /bookmarks


    //GET /bookmarks/:bookmark_id
    describe('GET /bookmarks/:bookmark_id', () => {
        context('Given no bookmarks', ()=> {
            it('responds with 404', () => {
                const bookmarkId = 1
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(404, {error: {message: "Bookmark doesn't exist!" }})
            })
        })
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();
            
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_tb')
                    .insert(testBookmarks)
            })
    
            it('GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(200, expectedBookmark)
            })
        })
    }) //end GET /bookmarks/:bookmark_id   


    //POST /bookmarks
    describe('POST /bookmarks', () => {
        it(`creates a bookmark, responding with 201 and the new bookmark`, function(){
            const newBookmark = {
                title:  "Test new website",
                url: "http://www.test-website.com",
                description: "This is test website.",
                rating: 4
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                })
                .then(postRes => 
                    supertest(app)
                        .get(`/bookmarks/${postRes.body.id}`)
                        .expect(postRes.body)
                )
        })
    })


}) //end Bookmarks Endpoints