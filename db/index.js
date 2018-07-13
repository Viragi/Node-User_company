const { Client } = require('pg');
let dbName = 'usercompany_db';
if (process.env.NODE_ENV == 'test') {
  dbName = 'usercompany_db-test';
}
const client = new Client({
  connectionString: `postgressql://localhost/${dbName}`
});

client.connect();
module.exports = client;
