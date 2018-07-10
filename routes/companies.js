const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

router.get('', async function(req, res, next) {
  try {
    const data = await db.query('select * from companies');
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async function(req, res, next) {
  try {
    const data = await db.query('select * from companies where id=$1', [
      req.params.id
    ]);
    const company_jobs = await db.query(
      'select id from jobs where company_id=$1',
      [req.params.id]
    );
    data.rows[0].jobs = company_jobs.rows.map(function(item) {
      return item.id;
    });
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.post('', async function(req, res, next) {
  try {
    const hashedpassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'insert into companies (name,logo,handle,password) values ($1,$2,$3,$4) returning*',
      [req.body.name, req.body.logo, req.body.handle, hashedpassword]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', async function(req, res, next) {
  try {
    const data = await db.query(
      'update companies set name=$1, logo=$2 where id=$3 returning*',
      [req.body.name, req.body.logo, req.params.id]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async function(req, res, next) {
  try {
    const data = await db.query(
      'delete from companies  where id=$1 returning*',
      [req.params.id]
    );
    return res.json({ message: 'deleted' });
  } catch (err) {
    return next(err);
  }
});
//company login authentication

router.post('/auth', async function(req, res, next) {
  try {
    const founduser = await db.query(
      'select * from companies where handle=$1',
      [req.body.handle]
    );
    if (founduser.rows.length === 0) {
      return res.json({ message: 'invalidd user name' });
    }
    const result = bcrypt.compare(
      req.body.password,
      founduser.rows[0].password
    );
    if (result === false) {
      return res.json({ message: 'incorrect password' });
    } else {
      const token = jsonwebtoken.sign(
        { user_id: founduser.rows[0].id },
        'secret'
      );
      return res.json({ token });
    }
  } catch (err) {
    return next(err);
  }
});
module.exports = router;
