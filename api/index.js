// Vercel Serverless Function Wrapper
// This file adapts the Express server for Vercel's serverless platform

const app = require('../server/index.js');

// Export as a serverless function
module.exports = app;
