require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connect } = require("./db/db");
const profileRoutes = require("./routes/profiles");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Ensure Mongo is connected before any route handler runs. Mongoose caches
// the connection, so subsequent requests resolve immediately.
app.use(async (req, res, next) => {
  try {
    await connect();
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/", (_req, res) => {
  res.json({ status: "success", message: "Profile service up" });
});

app.use("/api/profiles", profileRoutes);

app.use((_req, res) => {
  res.status(404).json({ status: "error", message: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ status: "error", message: "Server error" });
});

module.exports = app;
