//server.js to start our server on an appropriate port

const knex = require('knex')
const app = require('./app')

const { PORT, DATABASE_URL } = require('./config')

const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
})

app.set('db', db) //set the 'db' property on the app instance

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})



