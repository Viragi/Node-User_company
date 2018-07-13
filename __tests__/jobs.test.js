process.env.NODE_ENV = 'test';
const db = require('../db');
const request = require('supertest');
const app = require('..');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// global auth variable to store things for all the tests
const auth = {};

beforeAll(async () => {
  await db.query(
    `CREATE TABLE companies (id SERIAL PRIMARY KEY, 
      handle TEXT UNIQUE, 
      password TEXT NOT NULL, 
      name TEXT, logo TEXT );`
  );

  await db.query(
    `CREATE TABLE jobs (id SERIAL PRIMARY KEY, 
      title TEXT, salary TEXT, 
      equity FLOAT, 
      company_handle text NOT NULL REFERENCES companies(handle) ON DELETE CASCADE
      );`
  );

  await db.query(`CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    photo TEXT,
    current_company TEXT REFERENCES companies (handle) ON DELETE SET NULL
  )`);

  await db.query(`CREATE TABLE jobs_users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users (username) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs (id) ON DELETE CASCADE
  )`);
});

beforeEach(async () => {
  // login a user, get a token, store the user ID and token
  const hashedPassword = await bcrypt.hash('secret', 1);
  await db.query("INSERT INTO users (username, password) VALUES ('test', $1)", [
    hashedPassword
  ]);
  const response = await request(app)
    .post('/users/user-auth')
    .send({
      username: 'test',
      password: 'secret'
    });
  auth.token = response.body.token;
  console.log('auth_token', auth.token);
  auth.current_username = jwt.verify(auth.token, 'SECRETKEY').username;

  // do the same for company "companies"
  const hashedCompanyPassword = await bcrypt.hash('secret', 1);
  await db.query(
    "INSERT INTO companies (handle, password) VALUES ('testcompany', $1)",
    [hashedCompanyPassword]
  );
  const companyResponse = await request(app)
    .post('/companies/company-auth')
    .send({
      handle: 'testcompany',
      password: 'secret'
    });

  auth.company_token = companyResponse.body.token;
  auth.current_company_handle = jwt.verify(
    auth.company_token,
    'SECRETKEY'
  ).handle;


describe('GET /jobs', () => {
  test('gets a list of jobs', async () => {
    const response = await request(app)
      .get('/jobs')
      .set('authorization', auth.token);
    expect(response.status).toBe(200);
  });
});

describe('POST /jobs', () => {
  test('post jobs related to one company', async () => {
    //console.log(auth.current_username);
    const response = await request(app)
      .post(`/jobs`)
      .send({
        title: 'QA',
        salary: '100000',
        equity: 12,
        company_handle: 'testcompany'
      })
      .set('authorization', auth.company_token);
    console.log('response-body', response.body);
    expect(response.status).toBe(200);
  });
});

describe('jobs/:id/apply', function(){
  test('list usernames who have applied for this job(id)', async function(){
    await db.query('INSERT INTO jobs_users (username, job_id) VALUES ($1, $2)', [auth.current_username, 1]);
    const response = await request(app)
    .post({
      job_id: 1,
      username: auth.current_username
    }).send();
  })
})

// describe('delete/users/username', function() {
//   test('sucessfully delete own user', async function() {
//     const response = await request(app)
//       .delete(`/users/${auth.current_username}`)
//       .set(`authorization`, auth.token);
//     expect(response.status).toBe(200);
//     expect(response.body).toEquaqql({ message: 'unauthorized person' });
//   });

//   test('cannot delete another user', async function() {
//     const response = await request(app)
//       .delete(`/users/${auth.current_user_id + 1}`)
//       .set(`authorization`, auth.token);
//     expect(response.status).toBe(200);
//   });
// });

// describe('patch/companies/:id', function() {
//   test('sucessfully update own company', async function() {
//     const response = await request(app)
//       .patch(`/companies/${auth.current_user_id}`)
//       .send({
//         handle: 'testcompany',
//         password: 'secret',
//         name: 'hooli'
//       })
//       .set(`authorization`, auth.company_token);
//     expect(response.status).toBe(200);
//   });
// });

afterEach(async () => {
  // delete the users and company users
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM companies');
});

afterAll(async () => {
  await db.query('DROP TABLE IF EXISTS jobs_users');
  await db.query('DROP TABLE IF EXISTS jobs');
  await db.query('DROP TABLE IF EXISTS users');
  await db.query('DROP TABLE IF EXISTS companies');
  db.end();
});
