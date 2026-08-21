import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { plays } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

function formatPlay(p: any) {
  return {
    id: String(p.id),
    name: p.title,
    type: p.genre || '',
    era: p.era || '',
    source: p.source || '',
    status: p.fullText ? '可分析' : p.analyzedAt ? '已校验' : '待采集',
  };
}

function formatPlayDetail(p: any) {
  return {
    ...formatPlay(p),
    fullText: p.fullText || '',
  };
}

export async function playRoutes(app: FastifyInstance) {
  app.get('/plays', async (req) => {
    const { genre, era } = req.query as { genre?: string; era?: string };
    const conditions = [];
    if (genre) conditions.push(eq(plays.genre, genre));
    if (era) conditions.push(eq(plays.era, era));
    const rows = conditions.length > 0
      ? await db.select().from(plays).where(and(...conditions))
      : await db.select().from(plays);
    return rows.map(formatPlay);
  });

  app.get('/plays/:id', async (req) => {
    const id = Number(req.params.id);
    const [play] = await db.select().from(plays).where(eq(plays.id, id));
    if (!play) return { error: 'Play not found' };
    return formatPlayDetail(play);
  });
}
