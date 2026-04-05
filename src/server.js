import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { env } from './config/environment.js';
import { errorHandler } from './middleware/error-handler.js';
import pool from './config/database.js';
import logger from './utils/logger.js';
import pinoHttp from 'pino-http';

import authRouter from './modules/auth/auth.router.js';
import userRouter from './modules/users/user.router.js';
import recordRouter from './modules/records/record.router.js';
import dashboardRouter from './modules/dashboard/dashboard.router.js';

const app = express();

// Global Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));

const ALLOWED_ORIGINS = env.env === 'production'
  ? (process.env.ALLOWED_ORIGINS || '').split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

const MAX_PAYLOAD_SIZE = '10kb';
app.use(express.json({ limit: MAX_PAYLOAD_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_PAYLOAD_SIZE }));

// Request logging
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
}));

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description: 'API for Finance Data Processing and Access Control',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.js'], // Note: Intentionally avoiding deep swagger jsdoc comments for brevity, but setup is ready
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/records', recordRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.originalUrl} not found` });
});

// Error handling middleware must be last
app.use(errorHandler);

const PORT = env.port;

const server = app.listen(PORT, () => {
  logger.info(`Server is running in ${env.env} mode on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api/docs`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received: closing HTTP server`);
  server.close(async () => {
    await pool.end();
    logger.info('HTTP server and database connection closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
