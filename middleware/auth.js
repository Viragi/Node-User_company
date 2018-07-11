const jsonwebtoken = require('jsonwebtoken');

function userauthentication(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedtoken = jsonwebtoken.verify(token, 'SECRETKEY');
    return next();
  } catch (err) {
    return res.json({ message: 'user unauthorized' });
  }
}

function userauthorization(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedtoken = jsonwebtoken.verify(token, 'SECRETKEY');
    if (decodedtoken.user_id == req.params.id) {
      return next();
    } else {
      return res.json({ message: 'unauthorized person' });
    }
  } catch (err) {
    return res.json({ message: 'error found' });
  }
}

function companyauthentication(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedtoken = jsonwebtoken.verify(token, 'SECRETKEY');
    req.company_id = decodedtoken.company_id;
    return next();
  } catch (err) {
    return res.json({ message: 'Company unauthorized' });
  }
}

module.exports = {
  userauthentication,
  userauthorization,
  companyauthentication
};
