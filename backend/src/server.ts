import { app } from './app';
import { config } from './config/env';
import { getDb, closeDb } from './database/connection';

const startServer = () => {
  // Ensure database schema is initialized
  try {
    const db = getDb();
    const deptCount = (db.prepare('SELECT COUNT(*) as c FROM departments').get() as { c: number }).c;
    console.log(`Database connected (${deptCount} departments present)`);
  } catch (err) {
    console.error('Failed to initialize database connection on server start:', err);
    process.exit(1);
  }

  const server = app.listen(config.PORT, () => {
    console.log(`Workforce Analytics REST API running on port ${config.PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`CORS allowed origin: ${config.CORS_ORIGIN}`);
    console.log(`API Base URL: http://localhost:${config.PORT}/api`);
  });

  const handleShutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      closeDb();
      console.log('Database connection closed.');
      process.exit(0);
    });

    // Force exit after 5 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
};

startServer();
