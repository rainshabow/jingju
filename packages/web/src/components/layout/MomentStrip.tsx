interface Props {
  onNavigateDetail: () => void;
  playName?: string;
}

export function MomentStrip({ onNavigateDetail, playName = '当前剧本' }: Props) {
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dateStr = `周${['日','一','二','三','四','五','六'][now.getDay()]}`;

  return (
    <section style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, marginBottom: 14,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
          {dateStr} {timeStr} · 京剧数据集分析
        </div>
        <div style={{ marginTop: 5, fontSize: 14, color: 'var(--text)' }}>
          当前审阅：{playName} —— 点击图表元素联动三视图
        </div>
      </div>
      <button className="jv-button small" onClick={onNavigateDetail}>
        查看剧本详情
      </button>
    </section>
  );
}
