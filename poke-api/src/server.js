// Reuse the configured Express application from the application module.
const app = require("./app");

// Allow deployment environments to select a port; use 3000 for local development.
const port = process.env.PORT || 3000;

// Start accepting HTTP traffic only when this executable entry point is run.
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
