const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const {
  userauthentication,
  companyauthentication
} = require('../middleware/auth');
const { validate } = require('jsonschema');
const companiesSchema = require('../validation_schema/companySchema');

router.get('', userauthentication, async function(req, res, next) {
  try {
    const data = await db.query('select * from companies');
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.get('/:handle', userauthentication, async function(req, res, next) {
  try {
    const data = await db.query('select * from companies where handle=$1', [
      req.params.handle
    ]);
    const company_jobs = await db.query(
      'select id from jobs where company_handle=$1',
      [data.rows[0].id]
    );
    const employees = await db.query(
      'select username from users where current_company=$1',
      [data.rows[0].handle]
    );
    data.rows[0].employees = employees.rows.map(function(item) {
      return item.username;
    });
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
    const result = validate(req.body, companiesSchema);
    if (!result.valid) {
      // pass the validation errors to the error handler
      return next(result.errors.map(e => e.stack));
    }
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

router.patch('/:handle', companyauthentication, async function(req, res, next) {
  try {
    const data = await db.query(
      'update companies set name=$1, logo=$2, password=$3, handle=$4 where handle=$5 returning*',
      [
        req.body.name,
        req.body.logo,
        req.body.password,
        req.body.handle,
        req.params.handle
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:handle', companyauthentication, async function(
  req,
  res,
  next
) {
  try {
    const data = await db.query(
      'delete from companies  where handle=$1 returning*',
      [req.params.handle]
    );
    return res.json({ message: 'deleted' });
  } catch (err) {
    return next(err);
  }
});
//company login authentication

router.post('/company-auth', async function(req, res, next) {
  try {
    const founduser = await db.query(
      'select * from companies where handle=$1',
      [req.body.handle]
    );
    if (founduser.rows.length === 0) {
      return res.json({ message: 'invalid user name' });
    }
    const result = bcrypt.compare(
      req.body.password,
      founduser.rows[0].password
    );
    if (result === false) {
      return res.json({ message: 'incorrect password' });
    } else {
      const token = jsonwebtoken.sign(
        { handle: founduser.rows[0].handle },
        'SECRETKEY'
      );
      return res.json({ token });
    }
  } catch (err) {
    return next(err);
  }
});
module.exports = router;
