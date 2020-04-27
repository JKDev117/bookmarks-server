const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures')
const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()

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
        context('Given no bookmarks', () => {
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

        context('Given an XSS attack bookmark', () => {
            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks_tb')
                    .insert([maliciousBookmark])
            })

            it('removes XX attack content', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
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

        context('Given an XSS attack bookmark', () => {

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks_tb')
                    .insert([maliciousBookmark])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })


        })

    }) //end GET /bookmarks/:bookmark_id   


    //POST /bookmarks
    describe('POST /bookmarks', () => {
        it(`creates a bookmark, responding with 201 and the new bookmark`, function(){
            const newBookmark = {
                title:  "Test new bookmark",
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

        const requiredFields = ['title', 'url', 'rating']

        requiredFields.forEach(field => {
            const newBookmark = {
                title:  "Test new bookmark",
                url: "http://www.test-website.com",
                description: "This is test website.",
                rating: 4
            }

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
                delete newBookmark[field]
                return supertest(app)
                    .post('/bookmarks')
                    .send(newBookmark)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body`}
                    })
            })
        })
        
        it('removes XSS attack content from response', () => {
            return supertest(app)
                .post(`/bookmarks`)
                .send(maliciousBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedBookmark.title)
                    expect(res.body.description).to.eql(expectedBookmark.description)
                })
        })
    }) //end 'POST /bookmarks'


    //DELETE /bookmarks/:bookmark_id
    describe(`DELETE /bookmarks/:bookmark_id`, () => {
        context('Given no bookmarks', () => {
            it('responds with 404', () => {
                const bookmarkId = 123456
                return supertest(app)
                    .delete(`/bookmarks/${bookmarkId}`)
                    .expect(404, {error: {message: `Bookmark doesn't exist!`}})
            })
        })
        
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_tb')
                    .insert(testBookmarks)
            })

            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/bookmarks`)
                            .expect(expectedBookmarks)
                    )
            })
        })
    })

}) //end Bookmarks Endpoints


