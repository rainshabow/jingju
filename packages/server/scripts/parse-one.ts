/**
 * 解析单个 PDF 并打印结果。
 * 用法：pnpm --filter server exec tsx scripts/parse-one.ts <子目录> <文件名>
 * 示例：pnpm --filter server exec tsx scripts/parse-one.ts 01000000 01001001_空城计.pdf
 */
import '../src/env.js';
import { parsePDF } from '../src/services/pdf-parser.js';
import { join } from 'path';

const DATA_ROOT = join(process.cwd(), '..', '..', 'data', '赛题1-I京剧数据集', '京剧剧本');
const subDir = process.argv[2] || '01000000';
const filename = process.argv[3] || '01001001_空城计.pdf';

const filePath = join(DATA_ROOT, subDir, filename);

console.log(`📄 解析: ${filePath}`);
try {
  const result = await parsePDF(filePath);
  console.log(`✅ 提取 ${result.text.length} 字符 (${result.pages} 页)`);
  if (result.text.length > 0) {
    console.log('--- 前 500 字符 ---');
    console.log(result.text.slice(0, 500));
    console.log('--- 末尾 200 字符 ---');
    console.log(result.text.slice(-200));
  } else {
    console.log('⚠️ 文本为空 — 可能是扫描版 PDF，需 OCR 处理');
  }
} catch (e: any) {
  console.error('❌ 解析失败:', e.message);
}
