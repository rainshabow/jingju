import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { characters, relations, themes, narrativeStages } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// ── Helpers: map DB fields to frontend-compatible shape ──
const FAMILY_MAP: Record<string, string> = {
  '生': 'sheng', '旦': 'dan', '净': 'jing', '丑': 'chou',
};

function formatCharacter(r: any) {
  const family = FAMILY_MAP[r.roleType] || 'sheng';
  return {
    name: r.name,
    gender: r.gender,
    age: r.ageGroup,
    identity: r.identity,
    personality: r.personality,
    performance: r.performanceStyle,
    roleType: `${r.roleType}·${r.roleSubtype}`,
    family,
    confidence: r.confidence,
    centrality: r.centrality,
  };
}

function formatRelation(r: any) {
  return {
    from: r.charA,
    to: r.charB,
    type: r.relationType,
    strength: r.strength,
    evidence: r.evidence,
    description: r.description,
  };
}

function formatTheme(r: any) {
  const COLORS: Record<string, string> = {
    '忠义': '#C41E3A', '战争': '#2D6A4F', '天命': '#C8A415',
    '智谋': '#C41E3A', '爱情': '#2E5090', '生死': '#C8A415',
    '正义': '#E67E22', '复仇': '#C41E3A', '离别': '#8E44AD',
    '团圆': '#27AE60', '惩罚': '#E74C3C', '孝道': '#2980B9',
    '冤屈': '#C0392B', '信任': '#2E5090', '道德': '#16A085',
    '权力': '#7F8C8D', '忠诚': '#D35400', '背叛': '#8B0000',
    '智慧': '#2C3E50', '勇气': '#D35400', '牺牲': '#B71540',
    '命运': '#C8A415', '权谋': '#636E72', '抗争': '#E17055',
  };
  // 不在列表中的主题用 hash 确定性分配颜色
  const palette = ['#C41E3A','#2E5090','#C8A415','#2D6A4F','#E67E22','#8E44AD','#27AE60','#E74C3C','#2980B9','#16A085'];
  const hash = r.themeName.split('').reduce((s: number, c: string) => s + c.charCodeAt(0), 0);
  return {
    name: r.themeName,
    color: r.color || COLORS[r.themeName] || palette[hash % palette.length],
    value: r.weight,
    evidence: r.evidence,
    stages: typeof r.stages === 'string' ? JSON.parse(r.stages) : r.stages,
  };
}

// ── Routes ──
export async function characterRoutes(app: FastifyInstance) {
  app.get('/plays/:id/characters', async (req) => {
    const playId = Number(req.params.id);
    const rows = await db.select().from(characters).where(eq(characters.playId, playId));
    return rows.map(formatCharacter);
  });
}

export async function relationRoutes(app: FastifyInstance) {
  app.get('/plays/:id/relations', async (req) => {
    const playId = Number(req.params.id);
    const rows = await db.select().from(relations).where(eq(relations.playId, playId));
    return rows.map(formatRelation);
  });
}

export async function themeRoutes(app: FastifyInstance) {
  app.get('/plays/:id/themes', async (req) => {
    const playId = Number(req.params.id);
    const rows = await db.select().from(themes).where(eq(themes.playId, playId));
    return rows.map(formatTheme);
  });
}

function formatNarrative(r: any) {
  return {
    stage: r.stageName,
    value: r.intensity,
    note: r.note,
  };
}

export async function narrativeRoutes(app: FastifyInstance) {
  app.get('/plays/:id/narrative', async (req) => {
    const playId = Number(req.params.id);
    const rows = await db.select().from(narrativeStages)
      .where(eq(narrativeStages.playId, playId))
      .orderBy(narrativeStages.stageOrder);
    return rows.map(formatNarrative);
  });
}
