const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');

const usersRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const jobRoutes = require('./routes/jobs');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/users', usersRoutes);
app.use('/companies', companyRoutes);
app.use('/jobs', jobRoutes);

module.exports = app;
