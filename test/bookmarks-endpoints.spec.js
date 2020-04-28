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

    // --------------------------------------------------------------------------// GET /api/bookmarks
    describe('GET /api/bookmarks', () => {
        context('Given no bookmarks', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
    
            it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
                    .get('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
            })

        })

    }) //end GET /api/bookmarks


    //// ----------------------------------------------------------------// GET /api/bookmarks/:bookmark_id
    describe('GET /api/bookmarks/:bookmark_id', () => {
        context('Given no bookmarks', ()=> {
            it('responds with 404', () => {
                const bookmarkId = 1
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
    
            it('GET /api/bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
                    .get(`/api/bookmarks/${maliciousBookmark.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })


        })

    }) //end GET /api/bookmarks/:bookmark_id   


    //// ------------------------------------------------------------------------------// POST /api/bookmarks
    describe('POST /api/bookmarks', () => {
        it(`creates a bookmark, responding with 201 and the new bookmark`, function(){
            const newBookmark = {
                title:  "Test new bookmark",
                url: "http://www.test-website.com",
                description: "This is test website.",
                rating: 4
            }
            return supertest(app)
                .post('/api/bookmarks')
                .send(newBookmark)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
                })
                .then(postRes => 
                    supertest(app)
                        .get(`/api/bookmarks/${postRes.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
                    .post('/api/bookmarks')
                    .send(newBookmark)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body`}
                    })
            })
        })
        
        it('removes XSS attack content from response', () => {
            return supertest(app)
                .post(`/api/bookmarks`)
                .send(maliciousBookmark)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedBookmark.title)
                    expect(res.body.description).to.eql(expectedBookmark.description)
                })
        })
    }) //end 'POST /api/bookmarks'


    // -----------------------------------------------------------------------// DELETE /api/bookmarks/:bookmark_id
    describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
        context('Given no bookmarks', () => {
            it('responds with 404', () => {
                const bookmarkId = 123456
                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/bookmarks`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmarks)
                    )
            })
        })
    }) //end describe `DELETE /api/bookmarks/:bookmark_id`

     // -----------------------------------------------------------------------// PATCH /api/bookmarks/:bookmark_id
    describe(`PATCH /api/bookmarks/:bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .patch(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist!` } })
            })
        }) //end context `Given no bookmarks`

        context('Given there are Bookmarks in the database', () => {
              const testBookmarks = makeBookmarksArray()
         
              beforeEach('insert Bookmarks', () => {
                return db
                  .into('bookmarks_tb')
                  .insert(testBookmarks)
              })
         
              it('responds with 204 and updates the Bookmark', () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: "Website Updated Title",
                    url: "http://www.updated-website-url.com",
                    description: "This is updated description of website",
                    rating: 4
                }
                const expectedBookmark = {
                      ...testBookmarks[idToUpdate - 1],
                      ...updateBookmark
                }
                return supertest(app)
                  .patch(`/api/Bookmarks/${idToUpdate}`)
                  .send(updateBookmark)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(204)
                  .then(res =>
                    supertest(app)
                      .get(`/api/bookmarks/${idToUpdate}`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(expectedBookmark)
                  )
              })

              it(`responds with 400 when no required fields supplied`, () => {
                 const idToUpdate = 2
                 return supertest(app)
                   .patch(`/api/bookmarks/${idToUpdate}`)
                   .send({ irrelevantField: 'foo' })
                   .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                   .expect(400, {
                     error: {
                       message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
                     }
                   })
              })

              it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateBookmark = {
                  title: 'updated Bookmark title',
                }
                const expectedBookmark = {
                  ...testBookmarks[idToUpdate - 1],
                  ...updateBookmark
                }
          
                return supertest(app)
                  .patch(`/api/bookmarks/${idToUpdate}`)
                  .send({
                    ...updateBookmark,
                    fieldToIgnore: 'should not be in GET response'
                  })
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(204)
                  .then(res =>
                    supertest(app)
                      .get(`/api/bookmarks/${idToUpdate}`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(expectedBookmark)
                  )
              })
            
        }) //end context 'Given there are Bookmarks in the database'

    })// end describe `PATCH /api/bookmarks/:bookmark_id`

}) //end Bookmarks Endpoints


