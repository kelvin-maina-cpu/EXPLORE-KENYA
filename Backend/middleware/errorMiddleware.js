// Global error handler middleware
module.exports = (err, req, res, next) => {
  console.error(err.stack);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({ message: err.message || 'Something went wrong!' });
};
