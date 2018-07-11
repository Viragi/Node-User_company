drop database if exists "usercompany_db";
create database "usercompany_db";
\c "usercompany_db";

CREATE TABLE companies (id SERIAL PRIMARY KEY, 
handle TEXT UNIQUE, 
password TEXT NOT NULL, 
name TEXT, logo TEXT );

CREATE TABLE jobs (id SERIAL PRIMARY KEY, 
title TEXT, salary TEXT, 
equity FLOAT, 
company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  photo TEXT,
  current_company TEXT REFERENCES companies (handle) ON DELETE SET NULL
);

CREATE TABLE jobs_users (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES companies (id) ON DELETE CASCADE
);

-- psql < schema.sql