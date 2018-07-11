const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/index');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const {
  userauthentication,
  userauthorization,
  companyauthentication
} = require('../middleware/auth');

router.get('', userauthentication, companyauthentication, async function(
  req,
  res,
  next
) {
  try {
    const data = await db.query('select * from users');

    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.post('', async function(req, res, next) {
  try {
    const hashedpassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'insert into users (first_name,last_name,email,photo,current_company,username,password ) values ($1,$2,$3,$4,$5,$6,$7) returning*',
      [
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.photo,
        req.body.current_company,
        req.body.username,
        hashedpassword
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.get('/:username', userauthentication, async function(req, res, next) {
  try {
    const user_data = await db.query('select * from users where username=$1', [
      req.params.username
    ]);
    const user_jobs = await db.query(
      'select * from jobs_users where user_id=$1',
      [user_data.id]
    );
    var jobs = user_jobs.rows.map(item => item.job_id);
    user_data.rows[0].applied_to = jobs;
    return res.json(user_data.rows[0]);
  } catch (err) {
    return next(err);
  }
});
router.patch('/:id', userauthorization, async function(req, res, next) {
  try {
    const data = await db.query(
      'update users set first_name =$1 ,last_name=$2, email=$3 ,photo=$4, current_company_id=$6 , username=$7,password=$8 where id=$5 returning *',
      [
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.photo,
        req.params.id,
        req.body.current_company_id,
        req.body.username,
        req.body.password
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', userauthorization, async function(req, res, next) {
  try {
    await db.query('delete from users where id=$1 returning*', [req.params.id]);
    return res.json({ message: 'deleted' });
  } catch (err) {
    return next(err);
  }
});

// users can apply job and delete job
router.post('/:id/jobs/:job_id', async function(req, res, next) {
  try {
    const data = await db.query(
      'insert into jobs_users (job_id,user_id) values ($1,$2) returning*',
      [req.params.job_id, req.params.id]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

//Add a new route /users/auth. This route accepts a POST request with a username and password,
//and it returns a JWT if the username exists and the password is correct

router.post('/auth', async function(req, res, next) {
  try {
    const userfound = await db.query(
      'select * from users where username = $1',
      [req.body.username]
    );
    if (userfound.rows.length === 0) {
      return res.json({ message: 'Invalid Username' });
    }
    const passresult = await bcrypt.compare(
      req.body.password,
      userfound.rows[0].password
    );
    if (passresult == false) {
      return res.json({ message: 'invalid password' });
    } else {
      const token = jsonwebtoken.sign(
        { user_id: userfound.rows[0].id },
        'SECRETKEY'
      );
      return res.json({ token });
    }
  } catch (err) {
    return next(err);
  }
});
module.exports = router;
