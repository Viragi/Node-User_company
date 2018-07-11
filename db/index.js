const { Client } = require('pg');
let dbName = 'users-companies-jobs-auth-solutions';
if (process.env.NODE_ENV == 'test') {
  dbName = 'users-companies-jobs-auth-solutions-test';
}
const client = new Client({
  connectionString: 'postgressql://localhost/usercompany_db'
});

client.connect();
module.exports = client;
