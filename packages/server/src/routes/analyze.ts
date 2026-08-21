import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { plays } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parsePDF } from '../services/pdf-parser.js';
import { analyzePlay } from '../services/analyzer.js';

const UPLOAD_DIR = join(process.cwd(), 'data', 'uploads');
try { mkdirSync(UPLOAD_DIR, { recursive: true }); } catch {}

export async function analyzeRoutes(app: FastifyInstance) {
  // GET /api/analyze/:id/status
  app.get('/analyze/:id/status', async (req) => {
    const id = Number(req.params.id);
    const [play] = await db.select({
      analysisStatus: plays.analysisStatus,
      analysisProgress: plays.analysisProgress,
    }).from(plays).where(eq(plays.id, id));
    if (!play) return { error: 'Play not found' };
    return { id, status: play.analysisStatus || 'idle', progress: play.analysisProgress || 0 };
  });

  // POST /api/analyze/:id — 触发 AI 分析
  app.post('/analyze/:id', async (req, reply) => {
    const id = Number(req.params.id);
    const [play] = await db.select().from(plays).where(eq(plays.id, id));
    if (!play) { reply.code(404); return { error: 'Play not found' }; }
    if (!play.fullText) { reply.code(400); return { error: 'Play has no text' }; }

    const apiKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) { reply.code(503); return { error: 'LLM_API_KEY not configured' }; }

    analyzePlay(id).catch((e: Error) => console.error(`[analyze] failed #${id}:`, e.message));
    return { id, status: 'analyzing', progress: 0 };
  });

  // POST /api/upload — 上传 PDF 并自动分析
  app.post('/upload', async (req, reply) => {
    const file = await req.file();
    if (!file) { reply.code(400); return { error: 'No file uploaded' }; }
    if (!file.filename.endsWith('.pdf')) { reply.code(400); return { error: 'Only PDF files are accepted' }; }

    const filename = file.filename.replace(/[^a-zA-Z0-9\u4e00-\u9fff._-]/g, '_');
    const filepath = join(UPLOAD_DIR, `${Date.now()}_${filename}`);

    const buffer = await file.toBuffer();
    writeFileSync(filepath, buffer);

    // 提取剧名（去掉扩展名和日期前缀）
    let title = file.filename.replace(/\.pdf$/i, '').replace(/【.*?】/g, '').replace(/（.*?）/g, '').trim();
    if (!title) title = filename;

    // 写入 plays 表
    const [inserted] = await db.insert(plays).values({
      title,
      source: '用户上传',
      analysisStatus: 'analyzing',
      analysisProgress: 0,
    }).returning({ id: plays.id });

    const playId = inserted.id;

    // 异步 OCR + 分析
    (async () => {
      try {
        // Step 1: OCR
        await db.update(plays).set({ analysisProgress: 15 }).where(eq(plays.id, playId));
        const result = await parsePDF(filepath);
        await db.update(plays).set({
          fullText: result.text,
          analysisProgress: 35,
        }).where(eq(plays.id, playId));

        // Step 2: LLM 分析
        await analyzePlay(playId);
      } catch (e: any) {
        console.error(`[upload] pipeline failed #${playId}:`, e.message);
        await db.update(plays).set({
          analysisStatus: 'failed',
          analysisProgress: 0,
        }).where(eq(plays.id, playId));
      }
    })();

    return { id: playId, title, status: 'analyzing', progress: 5 };
  });
}
