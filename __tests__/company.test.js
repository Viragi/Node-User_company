const db = require('../db');
process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../');
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
      company_handle TEXT NOT NULL REFERENCES companies(handle) ON DELETE CASCADE
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
  auth.verified_company_token = jwt.verify(auth.company_token, 'SECRETKEY');
  auth.company_handle = auth.verified_company_token.handle;
  console.log(auth);
});

describe('GET /companies', () => {
  test('gets a list of all companies', async () => {
    const response = await request(app)
      .get('/companies')
      .set('authorization', auth.company_token);
    // console.log(response);
    expect(response.status).toBe(200);
    expect(response.body[0].handle).toEqual(auth.company_handle);
  });

  test('gets specs on specified company', async () => {
    const response = await request(app)
      .get(`/companies/${auth.company_handle}`)
      .set('authorization', auth.company_token);
    // console.log(auth.company_handle);
    // console.log(response);
    expect(response.body.handle).toEqual(auth.company_handle);
  });

  test('post a new company', async function() {
    const response = await request(app)
      .post('/companies')
      .send({
        name: 'linklink',
        handle: 'linko',
        logo: 'link',
        password: 'test123'
      })
      .set('authorization', auth.company_token);
    expect(response.status).toBe(200);
    expect(response.body.handle).toEqual('linko');
    // console.log(response);
  });

  test('update a company', async function() {
    const response = await request(app)
      .patch(`/companies/${auth.company_handle}`)
      .send({
        name: 'ling',
        handle: 'linko',
        logo: 'link',
        password: 'test123'
      })
      .set('authorization', auth.company_token);
    // console.log(response);
    expect(response.status).toBe(200);
    expect(response.body.name).toEqual('ling');
  });

  test('delete a company', async function() {
    const response = await request(app)
      .delete(`/companies/${auth.company_handle}`)
      .set('authorization', auth.company_token);
    // console.log(response);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'deleted' });
  });

  test('test to determine if company cannot delete a company with unauthorized token', async function() {
    const response = await request(app)
      .delete(`/companies/${auth.company_handle}`)
      .set('authorization', auth.token);
    // console.log(response);
    expect(response.status).toBe(403);
    // expect(response.body).toEqual({ message: 'deleted' });
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
