import type { Character } from '../../types';
import { roleColor } from '../shared/RoleBadge';

interface Props {
  selected: Character;
}

export function ReviewRibbon({ selected }: Props) {
  return (
    <section className="jv-section-card" style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr .8fr', gap: 14 }}>
        <div>
          <div className="jv-panel-kicker">当前核对对象</div>
          <div style={{ marginTop: 5, fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700 }}>
            {selected.name} · {selected.roleType}
          </div>
          <div style={{ marginTop: 6, color: 'var(--muted)', lineHeight: 1.65 }}>
            {selected.name} 被系统判定为 {selected.roleType}，核心依据来自身份"{selected.identity}"、
            性格"{selected.personality}"与表演方式"{selected.performance}"。
          </div>
        </div>
        <EvidenceMeter label="行当置信度" value={selected.confidence} color={roleColor(selected.family)} />
        <EvidenceMeter label="网络中心性" value={selected.centrality} color="#C8A415" />
      </div>
    </section>
  );
}

function EvidenceMeter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      padding: 12, background: 'var(--surface-solid)',
    }}>
      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{label}</div>
      <div style={{ margin: '12px 0 10px', fontFamily: 'var(--font-mono)', fontSize: 26, color }}>
        {value.toFixed(2)}
      </div>
      <div className="jv-bar-track">
        <span className="jv-bar-fill" style={{
          '--value': value,
          '--bar-color': color,
        } as React.CSSProperties} />
      </div>
    </div>
  );
}
