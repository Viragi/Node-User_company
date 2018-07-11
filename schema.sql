drop database if exists "usercompany_db";
create database "usercompany_db";
\c "usercompany_db";
create table companies(id serial primary key,name text )
create table users (id serial primary key,first_name text,last_name text 
,email text ,photo text , current_company_id integer references companies(id) on delete cascade,
username text unique not null, password text not null );
