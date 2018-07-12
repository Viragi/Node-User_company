const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/index');
const {
  userauthentication,
  companyauthentication,
  userauthorization
} = require('../middleware/auth');


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

router.post('/:company_id', companyauthentication, async function(
  req,
  res,
  next
) {
  try {
    const data = await db.query(
      'insert into jobs (title,salary,equity,company_id) values ($1,$2,$3,$4) returning*',
      [req.body.title, req.body.salary, req.body.equity, req.params.company_id]
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

router.get('/:id/apply' userauthorization async function(req, res, next){
try{
  const applicationData = 
} catch(err){
  return next(err);
}
});


module.exports = router;
