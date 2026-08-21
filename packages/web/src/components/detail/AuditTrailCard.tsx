import type { Character } from '../../types';
import { roleColor } from '../shared/RoleBadge';

interface Props {
  selected: Character;
}

export function AuditTrailCard({ selected }: Props) {
  const checks = [
    {
      code: '模型初判',
      status: '已完成',
      title: `${selected.name} 的行当候选生成`,
      text: `系统根据身份"${selected.identity}"、表演方式"${selected.performance}"与唱词位置，生成 3 个候选行当。`,
      tone: roleColor(selected.family),
    },
    {
      code: '规则复核',
      status: selected.confidence > 0.88 ? '通过' : '待确认',
      title: '与行当规则库交叉验证',
      text: selected.confidence > 0.88
        ? '候选结果与剧本时代、人物身份、舞台动作均无冲突。'
        : '唱念比例略低，建议人工确认是否需要降级为次要行当。',
      tone: selected.confidence > 0.88 ? '#2D6A4F' : '#C8A415',
    },
    {
      code: '证据绑定',
      status: '可审计',
      title: '绑定原文片段与关系边',
      text: '每条关系边保留来源句；主题强度来自阶段片段聚合，支持回到原文核对。',
      tone: '#2E5090',
    },
  ];

  return (
    <section className="jv-section-card">
      <div className="jv-section-head">
        <div>
          <div className="jv-section-title">AI 标注审计轨迹</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
            不是只给结论，而是展示模型、规则与证据如何合成当前标注。
          </div>
        </div>
        <span className="jv-pill">
          <span className="jv-dot" style={{ '--dot': roleColor(selected.family) } as React.CSSProperties} />
          当前：{selected.name}
        </span>
      </div>
      <div style={{
        padding: 16, display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12,
      }}>
        {checks.map((item, index) => (
          <article key={item.code} style={{
            position: 'relative', minHeight: 150,
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            background: 'var(--surface-solid)', padding: 14,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: item.tone }}>
                {String(index + 1).padStart(2, '0')} · {item.code}
              </span>
              <span className="jv-pill" style={{ height: 24 }}>
                <span className="jv-dot" style={{ '--dot': item.tone } as React.CSSProperties} />
                {item.status}
              </span>
            </div>
            <h3 style={{ margin: '16px 0 8px', fontSize: 16 }}>{item.title}</h3>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7, fontSize: 13 }}>
              {item.text}
            </p>
            <div style={{
              position: 'absolute', left: 14, right: 14, bottom: 12,
              height: 4, borderRadius: 999, background: 'var(--surface-muted)',
              overflow: 'hidden',
            }}>
              <span style={{
                display: 'block', width: `${72 + index * 12}%`,
                height: '100%', background: item.tone,
              }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
