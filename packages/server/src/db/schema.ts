import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ── 剧本表 ──
export const plays = sqliteTable('plays', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  code: text('code').unique(),           // PDF 编码 01001001
  source: text('source'),                // 《戏考》《京剧汇编》等
  genre: text('genre'),                  // 历史戏 / 家庭戏 / 公案戏
  era: text('era'),                      // 清代 / 清末 / 民国
  fullText: text('full_text'),           // PDF 原始文本
  analyzedAt: text('analyzed_at'),       // ISO 时间戳
  analysisStatus: text('analysis_status').default('idle'),  // idle | analyzing | done | failed
  analysisProgress: integer('analysis_progress').default(0), // 0-100
}, (table) => ({
  codeIdx: uniqueIndex('code_idx').on(table.code),
}));

// ── 角色表 ──
export const characters = sqliteTable('characters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playId: integer('play_id').references(() => plays.id).notNull(),
  name: text('name').notNull(),
  gender: text('gender'),                // 男 / 女
  ageGroup: text('age_group'),           // 青年 / 壮年 / 老年
  identity: text('identity'),            // 帝王 / 统帅 / 妃子
  personality: text('personality'),      // 刚烈 / 忠贞
  performanceStyle: text('performance_style'), // 唱为主 / 念与武打并重
  roleType: text('role_type'),           // 生 / 旦 / 净 / 丑
  roleSubtype: text('role_subtype'),     // 老生 / 花旦 / 架子花
  confidence: real('confidence'),        // 0-1
  centrality: real('centrality'),        // 网络中心性
});

// ── 关系表 ──
export const relations = sqliteTable('relations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playId: integer('play_id').references(() => plays.id).notNull(),
  charA: text('char_a').notNull(),       // 角色 A 名称
  charB: text('char_b').notNull(),       // 角色 B 名称
  relationType: text('relation_type'),   // 夫妻 / 君臣 / 敌对 / 同营
  strength: real('strength'),            // 0-1
  description: text('description'),      // 关系描述
  evidence: text('evidence'),            // 原文依据
});

// ── 主题表 ──
export const themes = sqliteTable('themes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playId: integer('play_id').references(() => plays.id).notNull(),
  themeName: text('theme_name').notNull(), // 忠义 / 爱情 / 战争
  weight: real('weight'),                  // 0-1 占比
  color: text('color'),                    // 可视化颜色
  evidence: text('evidence'),              // 支撑文本
  stages: text('stages'),                  // JSON: [0.18, 0.28, ...]
});

// ── 叙事结构表 ──
export const narrativeStages = sqliteTable('narrative_stages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playId: integer('play_id').references(() => plays.id).notNull(),
  stageOrder: integer('stage_order').notNull(),
  stageName: text('stage_name').notNull(), // 开端 / 发展 / 转折
  intensity: real('intensity'),            // 0-1
  note: text('note'),                      // 阶段说明
});
