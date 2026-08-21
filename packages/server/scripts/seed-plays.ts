/**
 * 种子脚本：从 data 目录导入剧本元数据到数据库。
 * 运行：pnpm --filter server tsx src/../scripts/seed-plays.ts
 *
 * 数据来源：data/赛题1-I京剧数据集/京剧剧本/
 * 读取 01000000/ 和 02000000/ 目录下的 PDF 文件名，
 * 提取编码和剧名，写入 plays 表。
 */
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { db, initDB } from '../src/db/index.js';
import { plays } from '../src/db/schema.js';

// ── 来源映射（基于数据说明.xlsx）──
const SOURCE_MAP: Record<string, string> = {
  '01': '《戏考》',
  '02': '《国剧大成》',
  '03': '《京剧汇编》',
  '04': '《京剧丛刊》',
  '05': '《传统剧目汇编》',
  '07': '《中国传统戏曲剧本选集》',
  '08': '《京剧集成》',
  '09': '《京剧流派剧目荟萃》',
  '10': '《戏考大全》',
  '11': '《传统戏曲剧目资料汇编》',
  '13': '《剧学月刊》',
  '14': '《戏典》',
  '15': '《大众戏曲丛书》',
  '70': '名家剧本选',
  '80': '录音记录本',
  '90': '名家藏本',
  '94': '院团改编本',
};

// ── 数据集根目录（相对于项目根）──
const DATA_ROOT = join(process.cwd(), '..', '..', 'data', '赛题1-I京剧数据集', '京剧剧本');

function extractPlayInfo(filename: string) {
  // 格式: XXYYZZZZ_剧名.pdf 或 XXYYZZZZ_剧名【附注】.pdf
  const match = filename.match(/^(\d{2})\d{2}\d{4}_(.+)\.pdf$/);
  if (!match) return null;
  const sourceCode = match[1];
  const titleRaw = match[2];
  // 清理版本标记
  const title = titleRaw
    .replace(/【.*?】/g, '')
    .replace(/（.*?）/g, '')
    .trim();
  const code = filename.replace(/\.pdf$/, '').split('_')[0];
  return {
    code,
    title,
    source: SOURCE_MAP[sourceCode] || '未知来源',
  };
}

async function seed() {
  initDB();

  // 限制数量：环境变量 MAX_PLAYS 或默认 5
  const limit = parseInt(process.env.MAX_PLAYS || '5', 10);

  const existing = await db.select({ code: plays.code }).from(plays);
  const existingCodes = new Set(existing.map((r) => r.code).filter(Boolean));

  const sources = listPDFs();

  let inserted = 0;
  for (const { filename } of sources) {
    if (inserted >= limit) break;
    const info = extractPlayInfo(filename);
    if (!info) continue;
    if (existingCodes.has(info.code)) continue;

    try {
      await db.insert(plays).values({
        title: info.title,
        code: info.code,
        source: info.source,
      });
      inserted++;
    } catch (e) {
      // 跳过重复
    }
  }

  console.log(`[seed] 插入 ${inserted} 个新剧本（限制 ${limit}，共 ${sources.length} 个 PDF）`);
}

function listPDFs() {
  const result: { filename: string; filepath: string }[] = [];
  const root = DATA_ROOT;
  if (!existsSync(root)) {
    console.warn(`[seed] 数据集目录不存在: ${root}`);
    return result;
  }
  const entries = readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const subDir = join(root, entry.name);
    try {
      const files = readdirSync(subDir);
      for (const f of files) {
        if (f.endsWith('.pdf')) {
          result.push({ filename: f, filepath: join(subDir, f) });
        }
      }
    } catch {}
  }
  return result;
}

seed().catch(console.error);
