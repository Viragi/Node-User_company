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
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE
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
  auth.current_username = jwt.decode(auth.token).username;
  console.log(auth.token);

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
  auth.current_company_handle = jwt.decode(auth.company_token).handle;
});

describe('GET /users', () => {
  test('gets a list of 1 user', async () => {
    const response = await request(app)
      .get('/users')
      .set('authorization', auth.token);
    expect(response.status).toBe(200);
    console.log(response.body);
    expect(response.body).toHaveLength(1);
  });
});

describe('GET /users/:username', () => {
  test('gets specs on specified user', async () => {
    console.log(auth.current_username);
    const response = await request(app)
      .get(`/users/${auth.current_username}`)
      .set('authorization', auth.token);
    //console.log(response.body);
    expect(response.body.username).toBe(auth.current_username);
  });
});

describe('delete/users/username', function() {
  test('sucessfully delete own user', async function() {
    const response = await request(app)
      .delete(`/users/${auth.current_username}`)
      .set(`authorization`, auth.token);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'deleted' });
  });

  test('cannot delete another user', async function() {
    const response = await request(app)
      .delete(`/users/${auth.current_username}`)
      .set(`authorization`, auth.token + 'dfsf');
    // expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'token invalid' });
  });
});

describe('patch/users/:username', function() {
  test('sucessfully update a user', async function() {
    const response = await request(app)
      .patch(`/users/${auth.current_username}`)
      .send({
        first_name: 'Michael',
        last_name: 'Hueter',
        username: 'hueter',
        email: 'michael@rithmschool.com',
        password: 'foo123',
        current_company: null,
        photo: 'https://avatars0.githubusercontent.com/u/13444851?s=460&v=4'
      })
      .set(`authorization`, auth.token);
    // console.log(response);
    expect(response.status).toBe(200);
    expect(response.body.first_name).toEqual('Michael');
  });
});

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
