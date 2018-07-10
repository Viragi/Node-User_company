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
      return res.json({ message: 'authorized person' });
    } else {
      return res.json({ message: 'unauthorized person' });
    }
  } catch (err) {
    return res.json({ message: 'error found' });
  }
}

module.exports = { userauthentication, userauthorization };
