import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config';
import { healthCheck } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import eventRoutes from './routes/event.routes';
import socialRoutes from './routes/social.routes';
import inviteRoutes from './routes/invite.routes';
import artistRoutes from './routes/artist.routes';
import placesRoutes from './routes/places.routes';

// Jobs
import { startEventAggregationJob } from './jobs/eventAggregation';

const app = express();
const server = createServer(app);

// Socket.io setup for real-time features
const io = new SocketServer(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Health check
app.get('/health', async (_req, res) => {
  const dbHealthy = await healthCheck();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected',
  });
});

// API routes
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/social`, socialRoutes);
app.use(`${API_PREFIX}/invites`, inviteRoutes);
app.use(`${API_PREFIX}/artists`, artistRoutes);
app.use(`${API_PREFIX}/places`, placesRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handler
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join event room for real-time updates
  socket.on('join-event', (eventId: string) => {
    socket.join(`event:${eventId}`);
  });

  socket.on('leave-event', (eventId: string) => {
    socket.leave(`event:${eventId}`);
  });

  // Join user room for notifications
  socket.on('authenticate', (userId: string) => {
    socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in routes
export { io };

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);

  // Start background jobs
  if (config.nodeEnv !== 'test') {
    startEventAggregationJob();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
