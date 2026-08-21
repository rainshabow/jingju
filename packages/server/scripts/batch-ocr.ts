/**
 * 批量 OCR 脚本：使用 PaddleOCR API 解析所有剧本 PDF 并写入数据库。
 * 运行：pnpm --filter server exec tsx scripts/batch-ocr.ts
 *
 * 需要设置 PADDLEOCR_TOKEN 环境变量。
 * 已解析剧本自动跳过。
 */
import '../src/env.js';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { db, initDB } from '../src/db/index.js';
import { plays } from '../src/db/schema.js';
import { eq, isNull } from 'drizzle-orm';
import { parsePDF } from '../src/services/pdf-parser.js';

const DATA_ROOT = join(process.cwd(), '..', '..', 'data', '赛题1-I京剧数据集', '京剧剧本');
const BATCH_SIZE = 3;     // 每批处理数量
const BATCH_DELAY = 3000;  // 批次间隔 (ms)

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function batchOCR() {
  initDB();

  if (!process.env.PADDLEOCR_TOKEN) {
    console.error('❌ 请设置 PADDLEOCR_TOKEN 环境变量');
    process.exit(1);
  }

  // 找到所有未提取文本的剧本
  const pending = await db
    .select({ id: plays.id, title: plays.title, code: plays.code })
    .from(plays)
    .where(isNull(plays.fullText))
    .limit(100);

  if (pending.length === 0) {
    console.log('[batch-ocr] 所有剧本已有文本');
    return;
  }

  console.log(`[batch-ocr] 待处理: ${pending.length} 个剧本`);

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batchItems = pending.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batchItems.map(async (p) => {
        const filePath = findPDF(p.code!);
        if (!filePath) {
          console.warn(`  ⚠ 未找到 PDF: ${p.code} (${p.title})`);
          return;
        }
        console.log(`  📄 解析: ${p.title} (${p.code})`);
        const result = await parsePDF(filePath);
        await db.update(plays)
          .set({ fullText: result.text })
          .where(eq(plays.id, p.id));
        console.log(`  ✅ ${p.title}: ${result.text.length} 字符, ${result.pages} 页`);
      }),
    );

    for (const r of results) {
      if (r.status === 'fulfilled') completed++;
      else { failed++; console.error('  ❌', (r.reason as Error).message); }
    }

    const done = Math.min(i + BATCH_SIZE, pending.length);
    console.log(`[batch-ocr] ${done}/${pending.length} (成功 ${completed}, 失败 ${failed})`);

    if (i + BATCH_SIZE < pending.length) {
      await sleep(BATCH_DELAY);
    }
  }

  console.log(`\n[batch-ocr] ✅ 完成: ${completed} 成功, ${failed} 失败`);
}

/**
 * 根据剧本编码查找 PDF 文件路径。
 * PDF 命名格式: XXYYZZZZ_剧名.pdf
 */
function findPDF(code: string): string | null {
  if (!existsSync(DATA_ROOT)) return null;

  const entries = readdirSync(DATA_ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const subDir = join(DATA_ROOT, entry.name);
    try {
      const files = readdirSync(subDir);
      for (const f of files) {
        if (f.startsWith(code) && f.endsWith('.pdf')) {
          return join(subDir, f);
        }
      }
    } catch {}
  }
  return null;
}

batchOCR().catch(console.error);
