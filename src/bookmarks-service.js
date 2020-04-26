
//making a service object first involves making an object that we'll export
const BookmarksService = {

    getAllBookmarks(knex){
        return knex.select('*').from('bookmarks_tb')
    },
    getById(knex, id){
        return knex.from('bookmarks_tb').select('*').where('id', id).first()
    }

}


module.exports = BookmarksService




