
//making a service object first involves making an object that we'll export
const BookmarksService = {

    getAllBookmarks(knex){
        return knex.select('*').from('bookmarks_tb')
    },
    getById(knex, id){
        return knex.from('bookmarks_tb').select('*').where('id', id).first()
    },
    insertBookmark(knex, newBookmark){
        return knex
            .insert(newBookmark)
            .into('bookmarks_tb')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    }
    

}


module.exports = BookmarksService




