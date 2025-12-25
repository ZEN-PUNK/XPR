/**
 * Entry Point for Experiment XX
 * 
 * This is the main entry point for the experiment.
 * Modify this file to implement your experiment's logic.
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    experiment: 'experiment_XX'
  });
});

// Main endpoint (customize as needed)
app.post('/api/example', (req, res) => {
  try {
    // TODO: Implement your logic here
    res.json({
      success: true,
      message: 'This is a template endpoint',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API endpoint: http://localhost:${PORT}/api/example`);
});
