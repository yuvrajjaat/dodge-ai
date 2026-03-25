require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDatabase } = require('./db/init');
const handleQuery = require('./routes/query');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
const db = initDatabase();

// API routes
app.post('/query', (req, res) => handleQuery(req, res, db));

app.get('/health', (req, res) => {
  const tableCount = db.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table'").get();
  res.json({ status: 'ok', tables: tableCount.c });
});

// Serve frontend build in production
const frontendBuild = path.resolve(__dirname, '../../frontend/build');
app.use(express.static(frontendBuild));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  db.close();
  process.exit(0);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
