interface Props {
  onClose: () => void;
}

export function AboutModal({ onClose }: Props) {
  return (
    <div className="jv-modal-backdrop">
      <section className="jv-upload-modal" role="dialog" aria-modal="true" aria-label="关于「戏韵万象」">
        <div className="jv-modal-head">
          <div>
            <div className="jv-modal-title">关于「戏韵万象」</div>
            <div style={{ marginTop: 8, color: 'var(--muted)', lineHeight: 1.75 }}>
              这是面向京剧文本研究的可视分析系统原型，用三视图联动把"角色行当、人物关系、主题结构"
              放在同一审阅时刻中。设计基于脸谱五色与宣纸质感，但尽量克制装饰，让数据证据成为主角。
            </div>
          </div>
          <button className="jv-drawer-close" onClick={onClose} aria-label="关闭关于">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18"/>
            </svg>
          </button>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10, marginTop: 20,
        }}>
          <AboutTile title="三图联动" text="点击角色、行当或主题，其他视图同步高亮相关证据。" />
          <AboutTile title="可审计 AI" text="详情页保留原文片段、置信度与待复核标记。" />
          <AboutTile title="研究工作台" text="默认一屏三列，适合评审会上快速发现异常标注。" />
        </div>
        <div style={{ marginTop: 18, textAlign: 'right' }}>
          <button className="jv-button primary" onClick={onClose}>我知道了</button>
        </div>
      </section>
    </div>
  );
}

function AboutTile({ title, text }: { title: string; text: string }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      padding: 12, background: 'var(--bg-soft)',
    }}>
      <strong>{title}</strong>
      <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
        {text}
      </p>
    </div>
  );
}
