const express = require('express');
const cors = require('cors');

const config = require('./config');
const healthRoutes = require('./routes/health.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Core middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.cors.origin.length ? config.cors.origin : '*',
    credentials: true,
  })
);

app.get("/", (req, res)=> {
  res.status(200).json({
    message: "Hello from coaching app!"
  });
});

// Routes
app.use('/api/health', healthRoutes);

// 404 + central error handler — must come LAST.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
