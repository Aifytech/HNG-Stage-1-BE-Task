const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const profileRoutes = require('../routes/profiles');
app.use('/api/profiles', profileRoutes);

module.exports = app;
