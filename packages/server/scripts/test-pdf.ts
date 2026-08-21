import { parsePDF } from '../src/services/pdf-parser.js';

const path = process.argv[2] || '../../data/赛题1-I京剧数据集/京剧剧本/01000000/01001001_空城计.pdf';

try {
  const result = await parsePDF(path);
  console.log(`📄 ${path}`);
  console.log(`   页数: ${result.pages}`);
  console.log(`   文本长度: ${result.text.length}`);
  console.log(`   需要OCR: ${result.needsOCR ? '是（扫描版）' : '否（文字版）'}`);
  if (result.text.length > 0) {
    console.log(`   前300字: ${result.text.slice(0, 300)}`);
  }
} catch (e: any) {
  console.error('❌', e.message);
}
