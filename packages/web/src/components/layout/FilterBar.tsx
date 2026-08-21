interface Props {
  mode: 'single' | 'cross';
  setMode: (mode: 'single' | 'cross') => void;
  filters: { play?: string };
  updateFilter: (key: string, value: string) => void;
  plays: Array<{ id: string; name: string }>;
}

export function FilterBar({ mode, setMode, filters, updateFilter, plays }: Props) {
  const isSingle = mode === 'single';
  return (
    <section className="jv-filterbar contextual">
      <div className="jv-filter-left">
        <div className="jv-filter-group">
          {isSingle ? (
            <label className="jv-field">剧本
              <select className="jv-select" value={filters.play || ''} onChange={(e) => updateFilter('play', e.target.value)}>
                {plays.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </label>
          ) : null}
        </div>
        <div className="jv-filter-scope">
          {isSingle
            ? '切换剧本后，三视图联动展示该剧本的分析结果。'
            : '基于当前所有已分析剧本的汇总统计。'}
        </div>
      </div>
      <div className="jv-mode-toggle" role="radiogroup" aria-label="视图模式">
        <button className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>单剧本</button>
        <button className={mode === 'cross' ? 'active' : ''} onClick={() => setMode('cross')}>跨剧本</button>
      </div>
    </section>
  );
}
