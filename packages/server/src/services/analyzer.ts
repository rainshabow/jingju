import { db } from '../db/index.js';
import { plays, characters, relations, themes, narrativeStages } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { extractCharacters, extractRelations, extractThemes } from './llm.js';
import { CHARACTER_PROMPT, RELATION_PROMPT, THEME_PROMPT } from './prompts.js';
const MAX_TEXT_LENGTH = 12000;

/** 从对象中按优先级取第一个非空值 */
function pick(obj: any, ...keys: string[]): any {
  if (typeof obj === 'string' || typeof obj === 'number') return obj;
  for (const k of keys) {
    if (obj?.[k] != null) return obj[k];
  }
  return undefined;
}

/** 为没有 stages 的主题生成模拟阶段分布（5 阶段，基于权重随机起伏） */
function generateStages(weight: number, themeCount: number): number[] {
  const stages: number[] = [];
  const base = weight * 0.6;
  for (let i = 0; i < 5; i++) {
    // 不同主题在不同阶段有不同峰值
    const phase = (i / 4) * Math.PI;
    const variation = Math.sin(phase + themeCount * 0.7) * 0.2;
    stages.push(Math.round(Math.max(0.05, Math.min(0.95, base + variation)) * 100) / 100);
  }
  return stages;
}

export async function analyzePlay(playId: number) {
  const updateStatus = async (s: string, p: number) => {
    try { await db.update(plays).set({ analysisStatus: s, analysisProgress: p }).where(eq(plays.id, playId)); } catch {}
  };

  try {
    const [play] = await db.select().from(plays).where(eq(plays.id, playId));
    if (!play || !play.fullText) { await updateStatus('failed', 0); throw new Error(`No text for #${playId}`); }
    const text = play.fullText.slice(0, MAX_TEXT_LENGTH);

    // 清理旧数据（防止重复）
    await db.delete(characters).where(eq(characters.playId, playId));
    await db.delete(relations).where(eq(relations.playId, playId));
    await db.delete(themes).where(eq(themes.playId, playId));
    await db.delete(narrativeStages).where(eq(narrativeStages.playId, playId));
    console.log(`[analyzer]   已清理旧分析数据`);

    // ── Step 1: 角色 ──
    await updateStatus('analyzing', 40);
    console.log(`[analyzer] Step 1/3: 角色 —《${play.title}》`);

    const charObj: any = await extractCharacters(CHARACTER_PROMPT.replace('{playText}', text));
    const charArray: any[] = Array.isArray(charObj) ? charObj : (charObj?.characters || []);
    for (const c of charArray) {
      await db.insert(characters).values({
        playId,
        name: pick(c, 'name'),
        gender: pick(c, 'gender'),
        ageGroup: pick(c, 'age_group', 'ageGroup', 'age'),
        identity: pick(c, 'identity'),
        personality: pick(c, 'personality'),
        performanceStyle: pick(c, 'performance_style', 'performanceStyle', 'performance'),
        roleType: pick(c, 'role_type', 'roleType'),
        roleSubtype: pick(c, 'role_subtype', 'roleSubtype', 'subtype'),
        confidence: pick(c, 'confidence') ?? 0.8,
        centrality: 0,
      });
    }
    await updateStatus('analyzing', 30);
    console.log(`[analyzer]   角色: ${charArray.length} 人`);

    // ── Step 2: 关系 ──
    const charList = charArray.map((c: any) =>
      `${c.name}(${c.role_type ?? c.roleType}·${c.role_subtype ?? c.roleSubtype})`
    ).join('\n');

    const relObj: any = await extractRelations(
      RELATION_PROMPT.replace('{characterList}', charList).replace('{playText}', text),
    );
    const relArray: any[] = Array.isArray(relObj) ? relObj : (relObj?.relations || []);
    for (const r of relArray) {
      await db.insert(relations).values({
        playId,
        charA: pick(r, 'char_a', 'charA', 'from'),
        charB: pick(r, 'char_b', 'charB', 'to'),
        relationType: pick(r, 'relation_type', 'relationType', 'type'),
        strength: pick(r, 'strength') ?? 0.5,
        evidence: pick(r, 'evidence') || '',
      });
    }
    await updateStatus('analyzing', 55);
    console.log(`[analyzer]   关系: ${relArray.length} 条`);

    // 计算网络中心性（度中心性 = 角色参与的关系数 / 最大度）
    const degreeMap = new Map<string, number>();
    for (const r of relArray) {
      const a = pick(r, 'char_a', 'charA', 'from');
      const b = pick(r, 'char_b', 'charB', 'to');
      if (a) degreeMap.set(a, (degreeMap.get(a) || 0) + 1);
      if (b) degreeMap.set(b, (degreeMap.get(b) || 0) + 1);
    }
    const maxDegree = Math.max(1, ...degreeMap.values());
    for (const [name, degree] of degreeMap) {
      await db.update(characters)
        .set({ centrality: Math.round(degree / maxDegree * 100) / 100 })
        .where(and(eq(characters.playId, playId), eq(characters.name, name)));
    }
    console.log(`[analyzer]   中心性: ${degreeMap.size} 个角色, 最大度=${maxDegree}`);

    // ── Step 3: 主题 + 叙事 + 分类 ──
    const themeObj: any = await extractThemes(THEME_PROMPT.replace('{playText}', text));

    // 更新剧本年代和类型
    const era = pick(themeObj, 'era');
    const genre = pick(themeObj, 'genre');
    if (era || genre) {
      await db.update(plays).set({
        ...(era ? { era: String(era) } : {}),
        ...(genre ? { genre: String(genre) } : {}),
      }).where(eq(plays.id, playId));
    }

    // 主题：LLM 可能返回对象数组或字符串数组
    const themeCount = (themeObj?.themes || []).length;
    for (const t of (themeObj?.themes || [])) {
      const name = pick(t, 'theme_name', 'themeName', 'name', 'theme');
      if (!name) { console.warn('[analyzer] 跳过无名称主题:', JSON.stringify(t).slice(0, 100)); continue; }
      const rawStages = pick(t, 'stages');
      // 如果 LLM 没返回 stages，根据叙事强度生成模拟阶段分布
      const stages = (Array.isArray(rawStages) && rawStages.length > 0)
        ? rawStages
        : generateStages(t.weight ?? 0.5, themeCount);
      await db.insert(themes).values({
        playId,
        themeName: String(name),
        weight: pick(t, 'weight', 'value') ?? 0.5,
        evidence: pick(t, 'evidence') || '',
        stages: JSON.stringify(stages),
      });
    }

    // 叙事阶段
    for (const n of (themeObj?.narrative || [])) {
      const stage = pick(n, 'stage_name', 'stageName', 'stage', 'name');
      if (!stage) { console.warn('[analyzer] 跳过无名称阶段'); continue; }
      await db.insert(narrativeStages).values({
        playId,
        stageOrder: pick(n, 'stage_order', 'stageOrder', 'order') ?? 0,
        stageName: String(stage),
        intensity: pick(n, 'intensity', 'value') ?? 0.5,
        note: pick(n, 'note', 'summary') || '',
      });
    }
    await updateStatus('analyzing', 80);
    console.log(`[analyzer]   主题: ${(themeObj?.themes || []).length}, 叙事: ${(themeObj?.narrative || []).length}`);

    await db.update(plays)
      .set({ analyzedAt: new Date().toISOString(), analysisStatus: 'done', analysisProgress: 100 })
      .where(eq(plays.id, playId));
    console.log(`[analyzer] ✅ 《${play.title}》完成`);
    return { success: true, playId };

  } catch (e: any) {
    console.error(`[analyzer] ❌ #${playId}:`, e.message);
    await updateStatus('failed', 0);
    throw e;
  }
}
