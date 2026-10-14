// Express 4 does not catch rejected promises from async handlers, so every async
// route is wrapped here and forwards its error to the error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
