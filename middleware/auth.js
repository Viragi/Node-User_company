const jsonwebtoken = require('jsonwebtoken');
const APIError = require('../APIError');

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
    console.log(token);
    const decodedtoken = jsonwebtoken.verify(token, 'SECRETKEY');
    console.log(decodedtoken);
    if (decodedtoken.username) {
      return next();
    } else {
      return res.json({ message: 'unauthorized person' });
    }
  } catch (err) {
    return res.json({ message: 'token invalid' });
  }
}

function companyauthentication(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedtoken = jsonwebtoken.verify(token, 'SECRETKEY');
    if (decodedtoken.handle) {
      req.handle = decodedtoken.handle;
      return next();
    } else {
      return next(new APIError(403, 'Forbidden', 'You cant do that.'));
    }
  } catch (err) {
    return next(new APIError(401, 'Unauthorized', 'Missing or invalid token.'));
  }
}

module.exports = {
  userauthentication,
  userauthorization,
  companyauthentication
};
