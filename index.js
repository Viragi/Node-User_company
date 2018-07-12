const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const pg = require('pg');
const usersRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const jobRoutes = require('./routes/jobs');
const cors = require('cors');
const APIError = require('./APIError');

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/users', usersRoutes);
app.use('/companies', companyRoutes);
app.use('/jobs', jobRoutes);

// at the bottom of index.js (app file), use this global error handler
app.use((error, request, response, next) => {
  // format built-in errors
  if (!(error instanceof APIError)) {
    error = new APIError(500, error.type, error.message);
  }
  // log the error stack if we're in development
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack); //eslint-disable-line no-console
  }

  return response.status(error.status).json(error);
});

module.exports = app;
