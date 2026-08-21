/**
 * 全流程一键脚本：seed → OCR → LLM 分析。
 * 用法：pnpm --filter server exec tsx scripts/pipeline-full.ts
 *
 * 前提：
 *   1. data/赛题1-I京剧数据集/京剧剧本/ 下有 PDF 文件
 *   2. .env 中已配置 PADDLEOCR_TOKEN 和 LLM_API_KEY
 */
import '../src/env.js';
import { db, initDB } from '../src/db/index.js';
import { plays } from '../src/db/schema.js';
import { eq, isNull, and, not } from 'drizzle-orm';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parsePDF } from '../src/services/pdf-parser.js';
import { analyzePlay } from '../src/services/analyzer.js';

const DATA_ROOT = join(process.cwd(), '..', '..', 'data', '赛题1-I京剧数据集', '京剧剧本');
const SOURCE_MAP: Record<string, string> = {
  '01': '《戏考》', '02': '《国剧大成》', '03': '《京剧汇编》',
  '04': '《京剧丛刊》', '05': '《传统剧目汇编》', '07': '《中国传统戏曲剧本选集》',
  '08': '《京剧集成》', '09': '《京剧流派剧目荟萃》', '13': '《剧学月刊》',
  '14': '《戏典》', '70': '名家剧本选', '80': '录音记录本', '90': '名家藏本', '94': '院团改编本',
};

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  initDB();

  const LIMIT = parseInt(process.env.MAX_PLAYS || '5', 10);
  console.log(`🎯 统一限制: ${LIMIT} 个剧本\n`);

  // ═══ Phase 1: Seed ═══
  console.log('═'.repeat(48));
  console.log('  Phase 1 — 扫描剧本 PDF');
  console.log('═'.repeat(48));

  const pdfs = listPDFs();
  console.log(`发现 ${pdfs.length} 个 PDF`);

  const existingCodes = new Set(
    (await db.select({ code: plays.code }).from(plays)).map((r) => r.code).filter(Boolean),
  );

  let seeded = 0;
  for (const { filename } of pdfs) {
    if (seeded >= LIMIT) break;
    const info = extractPlayInfo(filename);
    if (!info || existingCodes.has(info.code)) continue;
    try {
      await db.insert(plays).values({ title: info.title, code: info.code, source: info.source });
      seeded++;
    } catch {}
  }
  console.log(`✅ 写入 ${seeded} 个剧本 (已有 ${existingCodes.size} 个)`);

  // ═══ Phase 2: OCR ═══
  console.log('\n' + '═'.repeat(48));
  console.log('  Phase 2 — PaddleOCR 文本提取');
  console.log('═'.repeat(48));

  const noText = await db.select({ id: plays.id, title: plays.title, code: plays.code })
    .from(plays).where(isNull(plays.fullText)).limit(LIMIT);

  if (noText.length === 0) {
    console.log('所有剧本已有文本');
  } else {
    console.log(`待 OCR: ${noText.length} 个`);
    for (const p of noText) {
      const filePath = findPDF(p.code!);
      if (!filePath) { console.log(`  ⚠ 未找到 PDF: ${p.code}`); continue; }
      console.log(`  📄 ${p.title} (${p.code})`);
      try {
        const result = await parsePDF(filePath);
        await db.update(plays).set({ fullText: result.text }).where(eq(plays.id, p.id));
        console.log(`  ✅ ${result.text.length} 字符, ${result.pages} 页`);
      } catch (e: any) {
        console.error(`  ❌ ${e.message}`);
      }
      await sleep(2000);
    }
  }

  // ═══ Phase 3: LLM ═══
  console.log('\n' + '═'.repeat(48));
  console.log('  Phase 3 — LLM 角色/关系/主题分析');
  console.log('═'.repeat(48));

  const apiKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.includes('your-api-key')) {
    console.log('⚠  LLM_API_KEY 未配置，跳过分析');
  } else {
    const pending = await db.select({ id: plays.id, title: plays.title })
      .from(plays)
      .where(and(not(isNull(plays.fullText)), isNull(plays.analyzedAt)))
      .limit(LIMIT);

    if (pending.length === 0) {
      console.log('没有待分析的剧本');
    } else {
      console.log(`待分析: ${pending.length} 个`);
      for (const p of pending) {
        console.log(`  🤖 ${p.title} (#${p.id})`);
        try {
          await analyzePlay(p.id);
        } catch (e: any) {
          console.error(`  ❌ ${e.message}`);
        }
        await sleep(3000);
      }
    }
  }

  console.log('\n' + '═'.repeat(48));
  console.log('  ✅ 全流程完成');
  console.log('═'.repeat(48));
}

// ── Helpers ──

function extractPlayInfo(filename: string) {
  const match = filename.match(/^(\d{2})\d{2}\d{4}_(.+)\.pdf$/);
  if (!match) return null;
  const title = match[2].replace(/【.*?】/g, '').replace(/（.*?）/g, '').trim();
  return { code: filename.split('_')[0], title, source: SOURCE_MAP[match[1]] || '未知来源' };
}

function listPDFs() {
  const result: { filename: string; filepath: string }[] = [];
  if (!existsSync(DATA_ROOT)) { console.warn(`数据集目录不存在: ${DATA_ROOT}`); return result; }
  for (const entry of readdirSync(DATA_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      for (const f of readdirSync(join(DATA_ROOT, entry.name))) {
        if (f.endsWith('.pdf')) result.push({ filename: f, filepath: join(DATA_ROOT, entry.name, f) });
      }
    } catch {}
  }
  return result;
}

function findPDF(code: string): string | null {
  if (!existsSync(DATA_ROOT)) return null;
  for (const entry of readdirSync(DATA_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      for (const f of readdirSync(join(DATA_ROOT, entry.name))) {
        if (f.startsWith(code) && f.endsWith('.pdf')) return join(DATA_ROOT, entry.name, f);
      }
    } catch {}
  }
  return null;
}

main().catch(console.error);
