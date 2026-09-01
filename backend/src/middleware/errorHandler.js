const errorHandler = (err, req, res, next) => {
  console.error('[UHIS API Error]:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum allowed limit (10 MB).';
    }
  } else if (err.message && err.message.includes('Invalid file type')) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
