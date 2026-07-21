// Reusable matcher for the transport contract shared by live JSON endpoint tests.
function toBeSuccessfulJsonResponse(received) {
  const contentType = received?.headers?.get('content-type');
  const pass = received?.status >= 200
    && received.status < 300
    && /^application\/json(?:;|$)/i.test(contentType || '');

  return {
    pass,
    message: () => `expected a successful JSON response, received status ${received?.status} and Content-Type ${contentType}`
  };
}

module.exports = { toBeSuccessfulJsonResponse };
