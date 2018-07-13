class APIError extends Error {
  constructor(
    status = 500,
    title = 'Interal server error',
    message = 'We fucked up'
  ) {
    super(message); //call parent class contructor (Error) with message
    this.status = status;
    this.title = title;
    this.message = message;
    Error.captureStackTrace(this); // include the normal error stack trace for API errors
  }
  toJSON() {
    return {
      error: {
        status: this.status,
        title: this.title,
        message: this.message
      }
    };
  }
}

// next(testError);
// OR
// next(new APIError('401', 'Unauthorized', 'Must be logged in');)

module.exports = APIError;

//anywhere you use
// const APIError = require('./APIError');
