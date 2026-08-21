import { useState, useEffect } from 'react';
import { useLinkageStore } from '../stores/linkageStore';
import { api } from '../api';
import type { Play, Character, Relation, Theme, NarrativeStage, EraTrend, CrossThemeData } from '../types';
import { TopNavigation } from '../components/layout/TopNavigation';
import { FilterBar } from '../components/layout/FilterBar';
import { DashboardSingle } from './DashboardSingle';
import { DashboardCross } from './DashboardCross';
import { UploadModal } from '../components/shared/UploadModal';
import { AboutModal } from '../components/shared/AboutModal';

export default function Dashboard() {
  const store = useLinkageStore();
  const isSingle = store.viewMode === 'single';

  // ── All data ──
  const [plays, setPlays] = useState<Play[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [narrative, setNarrative] = useState<NarrativeStage[]>([]);
  const [eraTrend, setEraTrend] = useState<EraTrend[]>([]);
  const [totalChars, setTotalChars] = useState(0);
  const [cooccurrenceData, setCooccurrenceData] = useState<CrossThemeData>({ cooccurrence: [], bundles: [] });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [chartKind, setChartKind] = useState<'sankey' | 'table'>('sankey');
  const [topicKind, setTopicKind] = useState<'river' | 'bars'>('river');

  // ── Load data with graceful error handling ──
  useEffect(() => {
    setLoading(true);
    setErrors([]);

    const results = Promise.allSettled([
      api.plays.list(),
      api.characters(store.selectedPlayId),
      api.relations(store.selectedPlayId),
      api.themes(store.selectedPlayId),
      api.narrative(store.selectedPlayId),
      api.stats.roleTypes(),
      api.stats.themes(),
    ]);

    results.then((settled) => {
      const errs: string[] = [];
      const [p, c, r, t, n, rt, th] = settled;

      if (p.status === 'fulfilled') setPlays(p.value);
      else errs.push('剧本列表加载失败');

      if (c.status === 'fulfilled') setCharacters(c.value);
      else errs.push('角色数据加载失败');

      if (r.status === 'fulfilled') setRelations(r.value);
      else errs.push('关系数据加载失败');

      if (t.status === 'fulfilled') setThemes(t.value);
      else errs.push('主题数据加载失败');

      if (n.status === 'fulfilled') setNarrative(n.value);
      else errs.push('叙事数据加载失败');

      if (rt.status === 'fulfilled') {
        setEraTrend(rt.value?.eraTrend || []);
        const summary: Array<{ count: number }> = rt.value?.roleSummary || [];
        setTotalChars(summary.reduce((s, r) => s + r.count, 0));
      } else errs.push('统计·行当加载失败');

      if (th.status === 'fulfilled') {
        setCooccurrenceData(th.value || { cooccurrence: [], bundles: [] });
      } else errs.push('统计·主题加载失败');

      if (errs.length) setErrors(errs);

      // Cache the successfully loaded data
      if (c.status === 'fulfilled' && r.status === 'fulfilled' && t.status === 'fulfilled' && n.status === 'fulfilled') {
        store.cachePlayData(store.selectedPlayId, {
          characters: c.value,
          relations: r.value,
          themes: t.value,
          narrative: n.value,
        });
      }

      setLoading(false);
    });
  }, [store.selectedPlayId]);

  // ── Apply local filters to data ──
  const [filters, setFilters] = useState({ play: '' });

  const currentPlay = plays.find((p) => String(p.id) === store.selectedPlayId);

  const totalAnalyzed = plays.filter((p) => p.status === '已校验' || p.status === '可分析').length;

  const updateFilter = (key: string, value: string) => {
    if (key === 'play') {
      const play = plays.find((p) => p.name === value);
      if (play) store.selectPlay(String(play.id));
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="jv-app" style={{ '--density-scale': 1 } as React.CSSProperties}>
        <div className="jv-cloud top-left" /><div className="jv-cloud bottom-right" />
        <TopNavigation onOpenUpload={() => setUploadOpen(true)} onOpenAbout={() => setAboutOpen(true)} />
        <main className="jv-main" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
          <div className="jv-loading-face" />
          <div className="jv-empty" aria-live="polite">正在加载数据…</div>
        </main>
      </div>
    );
  }

  // ── Main ──
  return (
    <>
      <TopNavigation onOpenUpload={() => setUploadOpen(true)} onOpenAbout={() => setAboutOpen(true)} />
      <FilterBar
        mode={isSingle ? 'single' : 'cross'}
        setMode={store.setMode}
        filters={{ play: currentPlay?.name || '' }}
        updateFilter={updateFilter}
        plays={plays}
      />

      {/* Error banner */}
      {errors.length > 0 && (
        <div style={{ margin: '0 24px', padding: '10px 16px', background: 'rgba(196,30,58,.08)', border: '1px solid var(--opera-red)', borderRadius: 'var(--radius-sm)', color: 'var(--opera-red)', fontSize: 13, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>⚠ 部分数据加载失败：{errors.join('、')}</span>
          <button className="jv-button small" onClick={() => window.location.reload()}>重试</button>
        </div>
      )}

      {isSingle ? (
        <DashboardSingle
          plays={plays}
          characters={characters}
          relations={relations}
          themes={themes}
          narrative={narrative}
          chartKind={chartKind}
          topicKind={topicKind}
          onChartKindToggle={() => setChartKind((k) => k === 'sankey' ? 'table' : 'sankey')}
          onTopicKindToggle={() => setTopicKind((k) => k === 'river' ? 'bars' : 'river')}
        />
      ) : (
        <DashboardCross
          eraTrend={eraTrend}
          cooccurrenceData={cooccurrenceData}
          totalAnalyzed={totalAnalyzed}
          totalChars={totalChars}
        />
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUploaded={(playId) => {
            store.selectPlay(String(playId));
            // 刷新剧本列表
            api.plays.list().then(setPlays);
          }}
        />
      )}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </>
  );
}
