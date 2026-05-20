const ApiError = require('../utils/ApiError');

// 404 fallback — register after all routes, before the error handler.
module.exports = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
