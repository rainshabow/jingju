import { existsSync, readFileSync } from 'fs';
import { basename } from 'path';

const JOB_URL = 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs';
const TOKEN = process.env.PADDLEOCR_TOKEN || '';
const MODEL = process.env.PADDLEOCR_MODEL || 'PaddleOCR-VL-1.6';

/** 单页结果 */
interface PageResult {
  pageIndex: number;
  markdown: string;
  images: Record<string, string>;
}

/** parsePDF 返回值 */
export interface PDFResult {
  text: string;
  pages: number;
  needsOCR: boolean;
  /** 单页 markdown 列表（含图片引用） */
  pageResults?: PageResult[];
}

/**
 * 使用 PaddleOCR API 解析 PDF 为 Markdown 文本。
 *
 * 前提条件：
 *   1. 设置环境变量 PADDLEOCR_TOKEN
 *   2. PDF 文件存在且可读
 *
 * API 文档：https://www.paddleocr.ai/
 */
export async function parsePDF(filePath: string): Promise<PDFResult> {
  if (!TOKEN) {
    throw new Error('PADDLEOCR_TOKEN not configured. Set it in environment.');
  }
  if (!existsSync(filePath)) {
    throw new Error(`PDF not found: ${filePath}`);
  }

  const headers: Record<string, string> = {
    Authorization: `bearer ${TOKEN}`,
  };

  // ── Step 1: Submit job ──
  console.log(`[PaddleOCR] Submitting: ${basename(filePath)}`);

  const buffer = readFileSync(filePath);
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: 'application/pdf' }), basename(filePath));
  formData.append('model', MODEL);
  formData.append('optionalPayload', JSON.stringify({
    useDocOrientationClassify: false,
    useDocUnwarping: false,
    useChartRecognition: false,
  }));

  const submitRes = await fetch(JOB_URL, { method: 'POST', headers, body: formData });
  if (!submitRes.ok) {
    const errBody = await submitRes.text();
    throw new Error(`PaddleOCR submit failed (${submitRes.status}): ${errBody}`);
  }

  const submitJson = await submitRes.json() as { data: { jobId: string } };
  const jobId = submitJson.data.jobId;
  console.log(`[PaddleOCR] Job submitted: ${jobId}`);

  // ── Step 2: Poll for completion ──
  const POLL_INTERVAL = 5000;     // 5 秒轮询一次
  const MAX_POLL_TIME = 600_000;   // 最多等 10 分钟
  let jsonlUrl = '';
  let totalPages = 0;
  let elapsed = 0;

  while (elapsed < MAX_POLL_TIME) {
    await sleep(POLL_INTERVAL);
    elapsed += POLL_INTERVAL;

    const pollRes = await fetch(`${JOB_URL}/${jobId}`, { headers });
    if (!pollRes.ok) {
      throw new Error(`PaddleOCR poll failed (${pollRes.status})`);
    }

    const pollJson = await pollRes.json() as {
      data: {
        state: 'pending' | 'running' | 'done' | 'failed';
        extractProgress?: { totalPages?: number; extractedPages?: number };
        resultUrl?: { jsonUrl: string };
        errorMsg?: string;
      };
    };

    const { state } = pollJson.data;

    if (state === 'pending') {
      console.log('[PaddleOCR] Status: pending...');
    } else if (state === 'running') {
      const ep = pollJson.data.extractProgress;
      console.log(`[PaddleOCR] Status: running (${ep?.extractedPages ?? '?'}/${ep?.totalPages ?? '?'} pages)`);
    } else if (state === 'done') {
      const ep = pollJson.data.extractProgress;
      totalPages = ep?.extractedPages ?? 0;
      jsonlUrl = pollJson.data.resultUrl?.jsonUrl ?? '';
      console.log(`[PaddleOCR] Done: ${totalPages} pages extracted`);
      break;
    } else if (state === 'failed') {
      const errMsg = pollJson.data.errorMsg ?? 'Unknown error';
      throw new Error(`PaddleOCR job failed: ${errMsg}`);
    }

    const minutes = Math.floor(elapsed / 60_000);
    if (minutes > 0 && elapsed % 60_000 === POLL_INTERVAL) {
      console.log(`[PaddleOCR] 已等待 ${minutes} 分钟...`);
    }
  }

  // Timed out
  if (!jsonlUrl) {
    throw new Error(
      `PaddleOCR job timed out after ${Math.floor(MAX_POLL_TIME / 60_000)} minutes. ` +
      `Job ID: ${jobId}. The queue may be congested — retry later.`
    );
  }

  // ── Step 3: Download results ──
  if (!jsonlUrl) {
    throw new Error('PaddleOCR job completed but no result URL returned');
  }

  const resultRes = await fetch(jsonlUrl);
  if (!resultRes.ok) {
    throw new Error(`PaddleOCR result download failed (${resultRes.status})`);
  }

  const jsonlText = await resultRes.text();
  const lines = jsonlText.trim().split('\n').filter(Boolean);

  const pageResults: PageResult[] = [];
  let fullText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = JSON.parse(lines[i]);
    const result = line.result as {
      layoutParsingResults: Array<{
        markdown: { text: string; images: Record<string, string> };
      }>;
    };

    for (const lpr of result.layoutParsingResults) {
      const md = lpr.markdown.text;
      pageResults.push({
        pageIndex: i,
        markdown: md,
        images: lpr.markdown.images,
      });
      fullText += `\n--- 第 ${i + 1} 页 ---\n${md}\n`;
    }
  }

  console.log(`[PaddleOCR] ✅ Done: ${fullText.length} chars from ${pageResults.length} pages`);

  return {
    text: fullText.trim(),
    pages: totalPages || pageResults.length,
    needsOCR: false,
    pageResults,
  };
}

/** 异步 sleep */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
