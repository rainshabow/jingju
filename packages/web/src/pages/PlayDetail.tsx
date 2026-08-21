import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useLinkageStore } from '../stores/linkageStore';
import type { Play, Character, Relation, Theme, NarrativeStage } from '../types';
import { IconLine } from '../components/shared/IconLine';
import { RoleBadge } from '../components/shared/RoleBadge';
import { ReviewRibbon } from '../components/detail/ReviewRibbon';
import { RoleTable } from '../components/detail/RoleTable';
import { DetailNetwork } from '../components/detail/DetailNetwork';
import { NarrativeLine } from '../components/charts/NarrativeLine';
import { ThemeBars } from '../components/charts/ThemeBars';
import { SourcePreview } from '../components/detail/SourcePreview';

export default function PlayDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playId = id || '1';

  const [play, setPlay] = useState<Play | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [narrative, setNarrative] = useState<NarrativeStage[]>([]);
  const [highlight, setHighlight] = useState('');
  const dataCache = useLinkageStore((s) => s.dataCache);
  const cached = dataCache[playId];

  useEffect(() => {
    if (characters.length > 0 && !highlight) {
      setHighlight(characters[0].name);
    }
  }, [characters, highlight]);

  useEffect(() => {
    // Use cached data from Dashboard if available
    if (cached) {
      setCharacters(cached.characters);
      setRelations(cached.relations);
      setThemes(cached.themes);
      setNarrative(cached.narrative);
    } else {
      api.characters(playId).then(setCharacters);
      api.relations(playId).then(setRelations);
      api.themes(playId).then(setThemes);
      api.narrative(playId).then(setNarrative);
    }
    api.plays.byId(playId).then(setPlay);
  }, [playId, cached]);

  const selected = characters.find((c) => c.name === highlight) || characters[0];

  const avgConfidence = characters.length > 0
    ? Math.round(characters.reduce((s, c) => s + (c.confidence || 0), 0) / characters.length * 100)
    : 0;
  const evidenceCount = relations.filter((r) => r.evidence).length + themes.filter((t) => t.evidence).length;

  if (!play) {
    return (
      <div className="jv-app">
        <div className="jv-loading-face" />
        <div className="jv-empty">正在加载数据...</div>
      </div>
    );
  }

  return (
    <div className="jv-app">
      <div className="jv-cloud top-left" />
      <div className="jv-cloud bottom-right" />
      <header className="jv-topbar">
        <div className="jv-brand">
          <div className="jv-mask-mark" />
          <div>
            <div className="jv-brand-title">戏韵万象</div>
            <div className="jv-brand-subtitle">单剧本分析审阅</div>
          </div>
        </div>
        <div className="jv-actions">
          <button className="jv-button dark" onClick={() => setHighlight(characters[0]?.name || '')}>
            重置高亮
          </button>
          <button className="jv-button dark" onClick={() => navigate('/')}>
            返回主页
          </button>
        </div>
      </header>

      <main className="jv-detail-page">
        <section className="jv-detail-top">
          <div>
            <button className="jv-back" onClick={() => navigate('/')}>
              <IconLine name="back" /> 返回 Dashboard
            </button>
            <h1 className="jv-play-title">《{play.name}》</h1>
            <div style={{ color: 'var(--muted)', marginTop: 6 }}>
              来源：{play.source} · 年代：{play.era || '未知'} · 类型：{play.type || '未分类'}
            </div>
          </div>
          <div className="jv-meta">
            <span className="jv-pill">
              <span className="jv-dot" style={{ '--dot': '#2D6A4F' } as React.CSSProperties} />
              置信度 {avgConfidence}%
            </span>
            <span className="jv-pill">角色 {characters.length}</span>
            <span className="jv-pill">关系 {relations.length}</span>
            <span className="jv-pill">证据 {evidenceCount}条</span>
          </div>
        </section>

        {selected && <ReviewRibbon selected={selected} />}

        <RoleTable
          characters={characters}
          highlight={highlight}
          onSelect={setHighlight}
        />

        <div className="jv-detail-grid">
          <section className="jv-section-card">
            <div className="jv-section-head">
              <div>
                <div className="jv-section-title">关系网络</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                  同 Dashboard，但在详情页保留更多证据边标签。
                </div>
              </div>
              <span className="jv-pill">中心人物：{highlight}</span>
            </div>
            <div style={{ padding: 16 }}>
              <DetailNetwork
                characters={characters}
                relations={relations}
                highlight={highlight}
                onSelect={setHighlight}
              />
              <RelationEvidenceList relations={relations} highlight={highlight} />
            </div>
          </section>

          <section className="jv-section-card">
            <div className="jv-section-head">
              <div>
                <div className="jv-section-title">叙事结构</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                  折线展示戏剧张力，标注关键转折。
                </div>
              </div>
              <span className="jv-pill">
                <span className="jv-dot" style={{ '--dot': '#C8A415' } as React.CSSProperties} />
                高潮：{narrative.reduce((max, n) => n.value > max.value ? n : max, narrative[0])?.stage || '-'}
              </span>
            </div>
            <div style={{ padding: 16 }}>
              <NarrativeLine narrative={narrative} />
            </div>
          </section>
        </div>

        <section className="jv-section-card">
          <div className="jv-section-head">
            <div>
              <div className="jv-section-title">主题分布</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                水平柱状图展示全剧主题强度。
              </div>
            </div>
            <button className="jv-button small" onClick={() => setHighlight(characters[0]?.name || '')}>
              定位核心角色
            </button>
          </div>
          <ThemeBars themes={themes} />
        </section>

        {selected && <SourcePreview selected={selected} fullText={play.fullText || ''} themes={themes} relations={relations} />}
      </main>
    </div>
  );
}

function RelationEvidenceList({ relations, highlight }: { relations: Relation[]; highlight: string }) {
  const filtered = relations.filter(
    (r) => r.from === highlight || r.to === highlight,
  );
  if (filtered.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
      {filtered.map((rel) => (
        <div key={`${rel.from}-${rel.to}`} style={{
          display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10,
          padding: 10, border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', background: 'var(--surface-solid)',
        }}>
          <strong>{rel.from} / {rel.to}</strong>
          <span style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
            {rel.evidence}
          </span>
        </div>
      ))}
    </div>
  );
}
