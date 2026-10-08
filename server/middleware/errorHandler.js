// Central Error Handler conforming to 00_MASTER.md Section 60
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(`[Error] [${req.method}] ${req.originalUrl}:`, err);

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid resource identifier: ${err.value}`,
      errorCode: 'INVALID_ID'
    });
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      success: false,
      message: `Duplicate value entered for ${field}: ${err.keyValue[field]}`,
      errorCode: 'DUPLICATE_KEY_ERROR'
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed on input data.',
      errorCode: 'VALIDATION_ERROR',
      errors
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
      errorCode: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token has expired.',
      errorCode: 'TOKEN_EXPIRED'
    });
  }

  // Fallback 500
  res.status(err.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    errorCode: err.errorCode || 'INTERNAL_SERVER_ERROR'
  });
};

module.exports = errorHandler;
