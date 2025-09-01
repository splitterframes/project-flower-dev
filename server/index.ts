import express from 'express';
import { createServer } from 'http';
import routes from './routes';

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.static('dist/public'));

// API routes
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Mariposa API is running' });
});

// Catch-all for React routing
app.get('*', (req, res) => {
  res.sendFile(process.cwd() + '/dist/public/index.html');
});

const server = createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🦋 Mariposa server running on http://0.0.0.0:${PORT}`);
  console.log(`🌱 Garden management system initialized`);
  console.log(`🦋 960 butterflies across 7 rarity tiers ready`);
});

export default server;