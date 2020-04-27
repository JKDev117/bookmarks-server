function makeBookmarksArray() {
    return [
                {
                    id: 1,
                    title: "Website One",
                    url: "http://www.website-one.com",
                    description: "This is website one.",
                    rating: 4
                },
                {
                    id: 2,
                    title:  "Website Two",
                    url: "http://www.website-two.com",
                    description: "This is website two.",
                    rating: 4
                },
                {
                    id: 3,
                    title:  "Website Three",
                    url: "http://www.website-three.com",
                    description: "This is website three.",
                    rating: 4
                }
           ]
}

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'http://www.how-to.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 5
     }

     const expectedBookmark = {
         ...maliciousBookmark,
         title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
         description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
     }

     return {
         maliciousBookmark,
         expectedBookmark
     }

}


module.exports = { makeBookmarksArray, makeMaliciousBookmark }

