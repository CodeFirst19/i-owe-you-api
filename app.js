const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  next()
});


// 1. GLOBAL MIDDLEWARES
//Set security HTTP headers
app.use(helmet());
//middleware for more about routes accessed
//Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiter middleware - limit requests from same API
const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests have been made from this device. Please try again in an hour.'
});

app.use('/api', limiter);


//middleware to modify the incoming data - data from the body is added to the req
app.use(express.json({
  limit: '10kb'
}));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XXS
app.use(xss());

//Prevent against parameter pollution
app.use(hpp());

//Middleware to capture the date the req was made - test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

// Handle unavailable routes.
app.all('*', (req, res, next) => {
  console.log('404 Not Found');
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});


module.exports = app;