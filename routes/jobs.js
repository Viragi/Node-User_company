const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/index');
const {
  userauthentication,
  companyauthentication
} = require('../middleware/auth');
const jsonwebtoken = require('jsonwebtoken');

router.get('', userauthentication, async function(req, res, next) {
  try {
    const data = await db.query('select * from jobs');
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', userauthentication, async function(req, res, next) {
  try {
    const data = await db.query('select from jobs where id=$1', [
      req.params.id
    ]);
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.post('', companyauthentication, async function(req, res, next) {
  try {
    const data = await db.query(
      'insert into jobs (title,salary,equity,company_handle) values ($1,$2,$3,$4) returning*',
      [
        req.body.title,
        req.body.salary,
        req.body.equity,
        req.body.company_handle
      ]
    );
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', companyauthentication, async function(req, res, next) {
  try {
    const job_company_id = await db.query('SELECT * from jobs WHERE id=$1', [
      req.params.id
    ]);
    if (req.company_id !== job_company_id.id) {
      return next({ error: 'You didnt post this job so you cant update it.' });
    }
    const data = await db.query(
      ' update jobs set title=$1,salary=$2,equity=$3,company_id=$4 where id=$5 returning*',
      [
        req.body.title,
        req.body.salary,
        req.body.equity,
        req.body.company_id,
        req.params.id
      ]
    );
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async function(req, res, next) {
  try {
    const data = await db.query(' delete from  jobs  where id=$1 returning*', [
      req.params.id
    ]);
    return res.json({ message: 'deleted' });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/applications', async function(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedtoken = jsonwebtoken.verify(token, 'SECRETKEY');
    //console.log(decodedtoken);
    if (decodedtoken === false) {
      return res.json({ message: 'user unauthorized' });
    }
    const jobData = await db.query(
      'INSERT INTO jobs_users (job_id, username) VALUES ($1, $2) RETURNING *',
      [req.params.id, decodedtoken.username]
    );
    console.log(jobData.rows);
    return res.json(jobData.rows);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/applications', async function(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedtoken = jsonwebtoken.verify(token, 'SECRETKEY');
    //console.log(decodedtoken);
    if (decodedtoken.handle) {
      const response = await db.query(
        'select title from jobs where company_handle = $1',
        [decodedtoken.handle]
      );
      return res.json(response.rows);
    }
    if (decodedtoken.username) {
      const response = await db.query(
        'select title from jobs join jobs_users on jobs_users.job_id = jobs.id where username = $1',
        [decodedtoken.username]
      );
      return res.json(response.rows);
    }
    if (decodedtoken === false) {
      return res.json({ message: 'user unauthorized' });
    }
    // const jobData = await db.query(
    //   'INSERT INTO jobs_users (job_id, username) VALUES ($1, $2) RETURNING *',
    //   [req.params.id, decodedtoken.username]
    // );
    // console.log(jobData.rows);
    // return res.json(jobData.rows);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/applications/:application_id', async function(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedtoken = jsonwebtoken.verify(token, 'SECRETKEY');
    //console.log(decodedtoken);
    if (decodedtoken.handle) {
      const response = await db.query(
        'select title from jobs where company_handle = $1 and id=$2',
        [decodedtoken.handle, req.params.application_id]
      );
      return res.json(response.rows);
    }
    if (decodedtoken.username) {
      const response = await db.query(
        'select title from jobs join jobs_users on jobs_users.job_id = jobs.id where username = $1 and jobs_users.id=$2',
        [decodedtoken.username, req.params.application_id]
      );
      return res.json(response.rows);
    }
    if (decodedtoken === false) {
      return res.json({ message: 'user unauthorized' });
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
