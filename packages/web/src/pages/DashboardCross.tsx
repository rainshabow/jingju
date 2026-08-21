import type { EraTrend, CrossThemeData } from '../types';
import { PanelShell } from '../components/layout/PanelShell';
import { StackedAreaChart } from '../components/charts/StackedAreaChart';
import { ThemeCooccurrence } from '../components/charts/ThemeCooccurrence';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

interface Props {
  eraTrend: EraTrend[];
  cooccurrenceData: CrossThemeData;
  totalAnalyzed: number;
  totalChars: number;
}

export function DashboardCross({
  eraTrend, cooccurrenceData, totalAnalyzed, totalChars,
}: Props) {

  const crossRoleMetrics = [
    { label: '分析剧本', value: `${totalAnalyzed}本` },
    { label: '角色总数', value: `${totalChars}人` },
  ];

  const crossThemeMetrics = [
    { label: '主题组合', value: `${cooccurrenceData.bundles.length}组` },
    { label: '高频共现', value: cooccurrenceData.cooccurrence[0] ? `${cooccurrenceData.cooccurrence[0].source}+${cooccurrenceData.cooccurrence[0].target}` : '-' },
    { label: '剧本总数', value: `${totalAnalyzed}本` },
    { label: '共现边', value: `${cooccurrenceData.cooccurrence.length}条` },
  ];

  return (
    <ErrorBoundary>
      <Shell>
        <main className="jv-main">
          <section style={{ marginBottom: 16 }}>
            <div className="jv-panel-kicker">CROSS-PLAY ANALYSIS</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              跨剧本宏观比较
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
              基于 {totalAnalyzed} 本京剧剧本，比较不同年代的行当分布与主题组合规律。
            </div>
          </section>
          <div className="jv-dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <PanelShell kicker="01 · ERA TREND" title="年代行当分布"
              note="堆叠面积图展示不同时期生旦净丑占比变化。"
              metrics={crossRoleMetrics}
              action={<span className="jv-pill" style={{ fontSize: 10 }}>按角色数归一</span>}>
              <StackedAreaChart data={eraTrend} />
              <Insight>{eraInsight(eraTrend)}</Insight>
            </PanelShell>

            <PanelShell kicker="02 · THEME BUNDLES" title="主题共现与组合"
              note="节点连线宽度=主题共现频率。"
              metrics={crossThemeMetrics}
              action={<span className="jv-pill" style={{ fontSize: 10 }}>共现网络</span>}>
              <ThemeCooccurrence links={cooccurrenceData.cooccurrence} bundles={cooccurrenceData.bundles} />
              <Insight>{themeBundleInsight(cooccurrenceData)}</Insight>
            </PanelShell>
          </div>
        </main>
      </Shell>
    </ErrorBoundary>
  );
}

import { Shell } from './DashboardSingle';

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, background: 'var(--bg-soft)' }}>
      💡 {children}
    </div>
  );
}

function eraInsight(eraTrend: EraTrend[]): string {
  const qing = eraTrend.find((e) => e.era.includes('清'));
  if (!qing) return '年代趋势数据加载中';
  return `${qing.era}生行${(qing.sheng * 100).toFixed(0)}%、净行${(qing.jing * 100).toFixed(0)}%，旦行仅${(qing.dan * 100).toFixed(0)}%`;
}

function themeBundleInsight(data: CrossThemeData): string {
  if (data.bundles.length === 0) return '主题共现数据加载中';
  const maxBundle = data.bundles[0];
  return `${data.bundles.map((x) => `${x.name}(${x.themes})`).join(' | ')}，最高频: ${maxBundle ? `${maxBundle.name} ${maxBundle.plays}本` : ''}`;
}
