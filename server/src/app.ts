import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import teamsRoutes from './routes/teams.routes';
import workItemsRoutes from './routes/workItems.routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'newtonite-operations-api',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/items', workItemsRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// Central Error Handler
app.use(errorHandler);
