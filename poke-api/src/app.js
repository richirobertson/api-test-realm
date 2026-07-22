// Import Express so this module can define the API without starting a network listener.
const express = require("express");

// Exportable application instance: Supertest can exercise this directly in unit tests.
const app = express();

// Parse JSON request bodies before route handlers run.
app.use(express.json());

// Lightweight health endpoint for service and deployment checks.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Keep application setup separate from server startup for testability.
module.exports = app;
