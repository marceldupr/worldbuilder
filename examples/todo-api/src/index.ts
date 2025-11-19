import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import categoryAPIRoutes from './controllers/category-api.controller.js';
import tagAPIRoutes from './controllers/tag-api.controller.js';
import taskAPIRoutes from './controllers/task-api.controller.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    project: 'Todo API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/category-api', categoryAPIRoutes);
app.use('/tag-api', tagAPIRoutes);
app.use('/task-api', taskAPIRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Todo API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log('\n📡 API Endpoints:');
  console.log('  /category-api');
  console.log('  /tag-api');
  console.log('  /task-api');
});

export default app;
