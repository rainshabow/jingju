import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLinkageStore } from '../stores/linkageStore';
import type { Play, Character, Relation, Theme, NarrativeStage } from '../types';
import { PanelShell } from '../components/layout/PanelShell';
import { DetailDrawer } from '../components/layout/DetailDrawer';
import { MomentStrip } from '../components/layout/MomentStrip';
import { SankeyChart } from '../components/charts/SankeyChart';
import { ForceGraph } from '../components/charts/ForceGraph';
import { ThemeRiver } from '../components/charts/ThemeRiver';
import { ThemeBars } from '../components/charts/ThemeBars';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { roleColor } from '../components/shared/RoleBadge';

interface Props {
  plays: Play[];
  characters: Character[];
  relations: Relation[];
  themes: Theme[];
  narrative: NarrativeStage[];
  chartKind: 'sankey' | 'table';
  topicKind: 'river' | 'bars';
  onChartKindToggle: () => void;
  onTopicKindToggle: () => void;
}

export function DashboardSingle({
  plays, characters, relations, themes, narrative,
  chartKind, topicKind, onChartKindToggle, onTopicKindToggle,
}: Props) {
  const navigate = useNavigate();
  const store = useLinkageStore();

  const handleSelectRole = useCallback((name: string | null) => { store.highlightChar(name); }, [store]);
  const handleSelectTheme = useCallback((name: string | null) => { store.highlightTheme(name); }, [store]);
  const stageLabels = narrative.map((n) => n.stage);

  const currentPlay = plays.find((p) => String(p.id) === store.selectedPlayId);

  if (characters.length === 0) {
    return (
      <Shell>
        <main className="jv-main"><div className="jv-empty">暂无分析数据，请先上传剧本。</div></main>
      </Shell>
    );
  }

  const selectedRole = characters.find((c) => c.name === store.highlightedCharName) || null;
  const roleMetrics = [
    { label: '生', value: `${characters.filter((c) => c.family === 'sheng').length}人` },
    { label: '旦', value: `${characters.filter((c) => c.family === 'dan').length}人` },
    { label: '净', value: `${characters.filter((c) => c.family === 'jing').length}人` },
    { label: '丑', value: `${characters.filter((c) => c.family === 'chou').length}人` },
  ];
  const netMetrics = [
    { label: '节点', value: String(characters.length) },
    { label: '边', value: String(relations.length) },
    { label: '密度', value: (2 * relations.length / Math.max(1, characters.length * (characters.length - 1))).toFixed(2) },
    { label: '中心', value: store.highlightedCharName || characters[0]?.name || '-' },
  ];
  const evidenceCount = relations.filter((r) => r.evidence).length + themes.filter((t) => t.evidence).length;
  const themeMetrics = [
    { label: '核心主题', value: store.highlightedTheme || themes[0]?.name || '-' },
    { label: '主题数', value: String(themes.length) },
    { label: '阶段', value: String(narrative.length) },
    { label: '证据', value: `${evidenceCount}条` },
  ];

  return (
    <ErrorBoundary>
      <Shell>
        <main className="jv-main">
          <MomentStrip onNavigateDetail={() => navigate(`/play/${store.selectedPlayId}`)} playName={currentPlay?.name} />
          <div className="jv-dashboard-grid">
            {/* ① Role */}
            <PanelShell kicker="01 · CHARACTER TYPE" title="行当归属分析"
              note="角色特征→行当流向。点击右侧行当节点查看具体角色。"
              metrics={roleMetrics}
              action={<button className="jv-button small" onClick={onChartKindToggle}>{chartKind === 'sankey' ? '表格' : '桑基'}</button>}>
              {chartKind === 'sankey'
                ? <SankeyChart characters={characters} highlightedChar={store.highlightedCharName} onSelectRole={(name) => store.highlightChar(name, false)} />
                : <RoleList characters={characters} onSelect={handleSelectRole} />}
              <Insight>{roleInsight(characters)}</Insight>
            </PanelShell>

            {/* ② Network */}
            <PanelShell kicker="02 · RELATION NETWORK" title="角色关系网络"
              note="节点大小=中心性，边宽=互动强度。点击节点查看角色证据卡片。"
              metrics={netMetrics}>
              <ForceGraph characters={characters} relations={relations} highlightedChar={store.highlightedCharName} onSelectRole={handleSelectRole} />
              <Insight>{networkInsight(characters, relations)}</Insight>
            </PanelShell>

            {/* ③ Theme */}
            <PanelShell kicker="03 · THEME STRUCTURE" title="主题结构分析"
              note="河流宽度=主题在叙事阶段中的强度占比。"
              metrics={themeMetrics}
              action={<button className="jv-button small" onClick={onTopicKindToggle}>{topicKind === 'river' ? '柱状' : '河流'}</button>}>
              {topicKind === 'river'
                ? <ThemeRiver themes={themes} stages={stageLabels} highlightedTheme={store.highlightedTheme} onSelectTheme={handleSelectTheme} />
                : <ThemeBars themes={themes} />}
              <Insight>{themeInsight(themes, narrative)}</Insight>
            </PanelShell>
          </div>
          <DetailDrawer role={selectedRole} relations={relations} themes={themes} open={store.detailOpen} onClose={() => store.highlightChar(null)} />
        </main>
      </Shell>
    </ErrorBoundary>
  );
}

// ── Sub-components ──

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, background: 'var(--bg-soft)' }}>
      💡 {children}
    </div>
  );
}

function RoleList({ characters, onSelect }: { characters: Character[]; onSelect: (n: string | null) => void }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {characters.map((r) => (
        <button key={r.name} onClick={() => onSelect(r.name)}
          style={{ display: 'grid', gridTemplateColumns: '76px 1fr auto', alignItems: 'center', gap: 10,
            padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            background: 'var(--surface-solid)', color: 'var(--text)', textAlign: 'left' }}>
          <strong>{r.name}</strong>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{r.identity} · {r.performance}</span>
          <span className="jv-pill"><span className="jv-dot" style={{ '--dot': roleColor(r.family) } as React.CSSProperties} />{r.roleType}</span>
        </button>
      ))}
    </div>
  );
}

// Shared Shell used by both single and cross views
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="jv-app" style={{ '--density-scale': 1 } as React.CSSProperties}>
      <div className="jv-cloud top-left" /><div className="jv-cloud bottom-right" />
      {children}
    </div>
  );
}

// ── Insight helpers ──

function roleInsight(characters: Character[]): string {
  const j = characters.filter((c) => c.family === 'jing');
  if (j.length === 0) return '暂无行当数据';
  return `净行${j.length}人，身份: ${[...new Set(j.map((c) => c.identity))].join('、')}`;
}

function networkInsight(characters: Character[], relations: Relation[]): string {
  const top = [...characters].sort((a, b) => (b.centrality || 0) - (a.centrality || 0))[0];
  if (!top) return '暂无网络数据';
  return `${top.name}中心性最高(${(top.centrality || 0).toFixed(2)})，共${relations.length}条关系边`;
}

function themeInsight(themes: Theme[], narrative: NarrativeStage[]): string {
  const top = [...themes].sort((a, b) => (b.value || 0) - (a.value || 0))[0];
  if (!top) return '暂无主题数据';
  return `"${top.name}"权重最高(${(top.value || 0).toFixed(2)})，共${themes.length}个主题，${narrative.length}个叙事阶段`;
}
