function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // ethers v6 revert errors carry a `.shortMessage` / `.reason`
  const chainReason = err.shortMessage || err.reason;

  const status = err.status || (chainReason ? 400 : 500);
  const message = chainReason || err.message || "Internal server error";

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
