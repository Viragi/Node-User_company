const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgressql://localhost/usercompany_db'
});

client.connect();
module.exports = client;
