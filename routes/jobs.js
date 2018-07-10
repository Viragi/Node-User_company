const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/index');

router.get('', async function(req, res, next) {
  try {
    const data = await db.query('select * from jobs');
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async function(req, res, next) {
  try {
    const data = await db.query('select from jobs where id=$1', [
      req.params.id
    ]);
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.post('/:company_id', async function(req, res, next) {
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

router.patch('/:company_id/:id', async function(req, res, next) {
  try {
    const data = await db.query(
      ' update jobs set title=$1,salary=$2,equity=$3,company_id=$4 where id=$5 returning*',
      [
        req.body.title,
        req.body.salary,
        req.body.equity,
        req.params.company_id,
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
module.exports = router;
