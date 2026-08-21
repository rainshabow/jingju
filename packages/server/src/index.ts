import './env.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { initDB } from './db/index.js';
import { playRoutes } from './routes/plays.js';
import { characterRoutes, relationRoutes, themeRoutes, narrativeRoutes } from './routes/characters.js';
import { statsRoutes } from './routes/stats.js';
import { analyzeRoutes } from './routes/analyze.js';

// Initialize database
initDB();

const server = Fastify({ logger: true, bodyLimit: 50 * 1024 * 1024 });

await server.register(cors, { origin: true });
await server.register(multipart);

await server.register(playRoutes, { prefix: '/api' });
await server.register(characterRoutes, { prefix: '/api' });
await server.register(relationRoutes, { prefix: '/api' });
await server.register(themeRoutes, { prefix: '/api' });
await server.register(narrativeRoutes, { prefix: '/api' });
await server.register(statsRoutes, { prefix: '/api' });
await server.register(analyzeRoutes, { prefix: '/api' });

const port = parseInt(process.env.PORT || '3000', 10);
await server.listen({ port, host: '0.0.0.0' });
