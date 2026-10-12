export function asyncHandler(handler) {
  return function handleAsyncRequest(request, response, next) {
    return Promise.resolve(handler(request, response, next)).catch(next);
  };
}