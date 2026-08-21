/**
 * 批量 AI 分析脚本。
 * 运行：pnpm --filter server tsx ../../scripts/batch-analyze.ts
 *
 * 需要设置环境变量 DEEPSEEK_API_KEY。
 * 并发控制 + 失败重试 + 已分析跳过。
 */
import '../src/env.js';
import { db, initDB } from '../src/db/index.js';
import { plays } from '../src/db/schema.js';
import { eq, isNull, and, not } from 'drizzle-orm';
import { analyzePlay } from '../src/services/analyzer.js';

const CONCURRENCY = 3;   // 同时分析剧本数
const DELAY_MS = 2000;   // 批次间隔
const MAX_RETRIES = 2;   // 单剧本最大重试

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function batch() {
  initDB();

  const LIMIT = parseInt(process.env.MAX_PLAYS || '5', 10);

  const apiKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('❌ 请设置 LLM_API_KEY 环境变量');
    process.exit(1);
  }

  // 只分析有 OCR 文本但未分析的
  const unanalyzed = await db.select({ id: plays.id, title: plays.title })
    .from(plays)
    .where(and(not(isNull(plays.fullText)), isNull(plays.analyzedAt)))
    .limit(LIMIT);

  if (unanalyzed.length === 0) {
    console.log('[batch] 没有待分析的剧本');
    return;
  }

  console.log(`[batch] 待分析: ${unanalyzed.length} 个剧本 (限制 ${LIMIT})，并发: ${CONCURRENCY}`);

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < unanalyzed.length; i += CONCURRENCY) {
    const batchItems = unanalyzed.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      batchItems.map((p) => analyzeWithRetry(p.id, p.title)),
    );

    for (const r of results) {
      if (r.status === 'fulfilled') completed++;
      else failed++;
    }

    console.log(`[batch] 进度: ${Math.min(i + CONCURRENCY, unanalyzed.length)}/${unanalyzed.length} (成功 ${completed}, 失败 ${failed})`);

    if (i + CONCURRENCY < unanalyzed.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n[batch] ✅ 完成: ${completed} 成功, ${failed} 失败`);
}

async function analyzeWithRetry(playId: number, title: string): Promise<void> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await analyzePlay(playId);
      return;
    } catch (e: any) {
      if (attempt === MAX_RETRIES) throw e;
      console.warn(`[batch] 《${title}》重试 ${attempt + 1}...`);
      await sleep(3000);
    }
  }
}

batch().catch(console.error);
