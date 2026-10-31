/**
 * Centralised error-handling middleware.
 * Express identifies it as an error handler because it accepts four arguments.
 *
 * Normalises every thrown / next(err) error into a consistent JSON envelope:
 *   { success: false, message: "...", stack: "..." (dev only) }
 */
const errorHandler = (err, req, res, next) => {
  // Respect statusCode attached to the Error object, or set upstream on res; default to 500.
  let statusCode =
    err.statusCode ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  // Multer errors (e.g. file size exceeded or invalid field) are client bad requests
  if (err.name === "MulterError") {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Expose stack trace only in development to avoid leaking internals.
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;

