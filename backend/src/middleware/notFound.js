/**
 * 404 Not-Found handler.
 * Mounted AFTER all valid routes so it only fires when nothing else matched.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error); // forward to the centralised error handler
};

export default notFound;

