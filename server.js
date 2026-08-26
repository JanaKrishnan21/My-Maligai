import app from './app.js';
import { connectDB } from './config/db.js';
import { initReminderScheduler } from './services/reminderService.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server
const startServer = async () => {
  await connectDB();

  // Initialize background reminder scheduler
  initReminderScheduler();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 My Maligai Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📡 Local API URL: http://localhost:${PORT}/api/health`);
  });
};

startServer();
