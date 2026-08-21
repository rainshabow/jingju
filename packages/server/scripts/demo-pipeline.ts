/**
 * 全流程演示：PDF → OCR → LLM JSON（不做 schema 校验）
 */
import "../src/env.js";
import { parsePDF } from "../src/services/pdf-parser.js";
import { extractCharacters, extractRelations, extractThemes } from "../src/services/llm.js";
import { CHARACTER_PROMPT, RELATION_PROMPT, THEME_PROMPT } from "../src/services/prompts.js";

const MAX_TEXT = 12000;

const filePath = process.argv[2];
if (!filePath) {
  console.error("用法: pnpm --filter server exec tsx scripts/demo-pipeline.ts <PDF路径>");
  process.exit(1);
}

function hr(title: string) {
  console.log("\n" + "═".repeat(64));
  console.log(`  ${title}`);
  console.log("═".repeat(64));
}

async function main() {
  // ═══ Step 0: OCR ═══
  hr("Step 0 — PDF 文本提取 (PaddleOCR)");
  const pdfResult = await parsePDF(filePath);
  const text = pdfResult.text.slice(0, MAX_TEXT);
  console.log(`\n📊 ${pdfResult.pages} 页, ${pdfResult.text.length} 字符 → LLM 输入 ${text.length} 字符`);
  console.log("─".repeat(48));
  console.log(text.slice(0, 600));
  console.log(`... [省略] ...\n` + text.slice(-200));
  console.log("─".repeat(48));

  // ═══ Step 1: 角色 ═══
  hr("Step 1 — 角色行当提取");
  const chars = await extractCharacters(CHARACTER_PROMPT.replace("{playText}", text));
  console.log(JSON.stringify(chars, null, 2));

  // ═══ Step 2: 关系 ═══
  hr("Step 2 — 角色关系提取");
  const rels = await extractRelations(
    RELATION_PROMPT
      .replace("{characterList}", "[见 Step 1 输出]")
      .replace("{playText}", text),
  );
  console.log(JSON.stringify(rels, null, 2));

  // ═══ Step 3: 主题 ═══
  hr("Step 3 — 主题结构与叙事阶段");
  const themes = await extractThemes(THEME_PROMPT.replace("{playText}", text));
  console.log(JSON.stringify(themes, null, 2));

  hr("✅ 全流程完成");
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
