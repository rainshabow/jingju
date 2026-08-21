/** 剧本 */
export interface Play {
  id: string;
  name: string;
  type: string;
  era: string;
  source: string;
  status: string;
  fullText?: string;
}

/** 角色 */
export interface Character {
  name: string;
  gender: string;
  age: string;
  identity: string;
  personality: string;
  performance: string;
  roleType: string;
  family: 'sheng' | 'dan' | 'jing' | 'chou';
  confidence: number;
  centrality: number;
}

/** 角色关系 */
export interface Relation {
  from: string;
  to: string;
  type: string;
  strength: number;
  evidence: string;
  description?: string;
}

/** 主题 */
export interface Theme {
  name: string;
  color: string;
  value: number;
  evidence: string;
  stages: number[];
}

/** 叙事阶段 */
export interface NarrativeStage {
  stage: string;
  value: number;
  note: string;
}

/** 年代行当趋势 */
export interface EraTrend {
  era: string;
  sheng: number;
  dan: number;
  jing: number;
  chou: number;
}

/** 身份×行当热力图 */
export interface HeatmapCell {
  identity: string;
  family: string;
  value: number;
}

/** 网络结构模板 */
export interface NetworkTemplate {
  type: string;
  form: string;
  density: number;
  cluster: number;
  center: string;
}

/** 行当汇总 */
export interface RoleSummary {
  label: string;
  count: number;
  color: string;
}

/** 主题共现 */
export interface ThemeCooccurrenceLink {
  source: string;
  target: string;
  value: number;
}

/** 主题套餐 */
export interface ThemeBundle {
  name: string;
  themes: string;
  plays: number;
}

/** 跨剧本主题数据 */
export interface CrossThemeData {
  cooccurrence: ThemeCooccurrenceLink[];
  bundles: ThemeBundle[];
}
