const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to add a unique request ID to each request
 * This is useful for tracking requests through logs
 */
module.exports = function(req, res, next) {
  // Generate a new UUID or use the one provided in the headers
  req.id = req.headers['x-request-id'] || uuidv4();
  
  // Set the response header with the request ID
  res.setHeader('X-Request-ID', req.id);
  
  next();
};