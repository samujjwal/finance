#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Database access endpoints
app.get('/api/portfolio', async (req, res) => {
  try {
    const dbPath = path.join(__dirname, '..', '..', 'investment_portfolio.db');
    const data = await fs.readFile(dbPath, 'utf8');
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('Error reading portfolio data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '..', '..', 'reports', 'all_transactions.csv');
    const data = await fs.readFile(csvPath, 'utf8');
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('Error reading transactions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/backup', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', '..', 'backups');
    
    await fs.mkdir(backupDir, { recursive: true });
    
    // Backup database
    const dbSource = path.join(__dirname, '..', '..', 'investment_portfolio.db');
    const dbBackup = path.join(backupDir, `portfolio_${timestamp}.db`);
    await fs.copyFile(dbSource, dbBackup);
    
    // Backup reports
    const reportsSource = path.join(__dirname, '..', '..', 'reports');
    const reportsBackup = path.join(backupDir, `reports_${timestamp}`);
    
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec(`cp -r "${reportsSource}" "${reportsBackup}"`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    res.json({ 
      success: true, 
      backup: {
        database: dbBackup,
        reports: reportsBackup,
        timestamp: timestamp
      }
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`JCL Investment Portfolio backend running on port ${PORT}`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Node.js version: ${process.version}`);
});

// Auto-recovery mechanism
let restartCount = 0;
const MAX_RESTARTS = 5;

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (restartCount < MAX_RESTARTS) {
    restartCount++;
    console.log(`Attempting restart ${restartCount}/${MAX_RESTARTS}`);
    setTimeout(() => {
      process.exit(1); // Let the parent process restart us
    }, 1000);
  } else {
    console.error('Max restart attempts reached, exiting...');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
