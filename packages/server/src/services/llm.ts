import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject, generateText } from "ai";
import { jsonrepair } from "jsonrepair";

const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com";
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY || "sk-placeholder";
const LLM_MODEL = process.env.LLM_MODEL || "deepseek-chat";
const LLM_TEMPERATURE = parseFloat(process.env.LLM_TEMPERATURE || "0.1");
const LLM_MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS || "4096", 10);

const provider = createOpenAICompatible({
  name: LLM_MODEL,
  baseURL: LLM_BASE_URL,
  apiKey: LLM_API_KEY,
});

if (LLM_API_KEY.includes("your-api-key") || LLM_API_KEY === "sk-placeholder") {
  console.warn("[LLM] ⚠️  LLM_API_KEY 仍是占位符");
}

const model = provider(LLM_MODEL);
const sharedOptions = { temperature: LLM_TEMPERATURE, maxTokens: LLM_MAX_TOKENS };

/**
 * 调用 generateObject，如果 JSON 解析失败则用 generateText + jsonrepair 修复重试。
 */
async function safeGenerateObject(prompt: string, jsonHint: string): Promise<any> {
  try {
    const result = await generateObject({
      model,
      output: "no-schema",
      prompt: prompt + jsonHint,
      ...sharedOptions,
    });
    return result.object;
  } catch (err: any) {
    // JSON 解析失败时，用 generateText 获取原始文本，jsonrepair 修复后解析
    if (err.name === "AI_NoObjectGeneratedError" || String(err).includes("JSON") || String(err).includes("parse")) {
      console.warn("[LLM] generateObject 失败，尝试 jsonrepair 修复...");
      const textResult = await generateText({ model, prompt: prompt + jsonHint, ...sharedOptions });
      const raw = textResult.text;
      // 提取 JSON 块
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      const candidate = match ? match[1] || match[0] : raw;
      try {
        return JSON.parse(jsonrepair(candidate));
      } catch {
        return JSON.parse(jsonrepair(raw));
      }
    }
    throw err;
  }
}

export async function extractCharacters(prompt: string) {
  return safeGenerateObject(prompt, '\n\nReturn JSON: {"characters": [...]}');
}

export async function extractRelations(prompt: string) {
  return safeGenerateObject(prompt, '\n\nReturn JSON: {"relations": [...]}');
}

export async function extractThemes(prompt: string) {
  return safeGenerateObject(prompt, '\n\nReturn JSON: {"themes": [...], "narrative": [...]}');
}
