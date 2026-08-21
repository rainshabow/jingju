import type { Character, Relation, Theme } from '../../types';
import { RoleBadge } from '../shared/RoleBadge';

interface Props {
  role: Character | null;
  relations: Relation[];
  themes: Theme[];
  open: boolean;
  onClose: () => void;
}

export function DetailDrawer({ role, relations, themes, open, onClose }: Props) {
  if (!role) return null;
  const roleRelations = relations.filter(
    (r) => r.from === role.name || r.to === role.name,
  );

  return (
    <aside className={`jv-detail-drawer${open ? ' open' : ''}`}>
      <div className="jv-drawer-accent" style={{ '--drawer-color': roleColor(role.family) } as React.CSSProperties} />
      <button className="jv-drawer-close" onClick={onClose} aria-label="关闭详情">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
      <div className="jv-drawer-title">{role.name}</div>
      <div className="jv-drawer-sub">
        <RoleBadge family={role.family}>{role.roleType}</RoleBadge>
        <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          置信度 {role.confidence.toFixed(2)}
        </span>
      </div>

      <div className="jv-drawer-section">
        <div className="jv-keygrid">
          <span>性别</span><span>{role.gender}</span>
          <span>年龄</span><span>{role.age}</span>
          <span>身份</span><span>{role.identity}</span>
          <span>性格</span><span>{role.personality}</span>
          <span>表演</span><span>{role.performance}</span>
        </div>
      </div>

      <div className="jv-drawer-section">
        <strong>关联关系</strong>
        <div className="jv-related-list" style={{ marginTop: 10 }}>
          {roleRelations.map((r) => (
            <div key={`${r.from}-${r.to}`} className="jv-related-item">
              <span>{r.from} ←{r.type}→ {r.to}</span>
              <b>{r.strength.toFixed(2)}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="jv-drawer-section">
        <strong>参与主题</strong>
        <div className="jv-pill-row" style={{ marginTop: 10 }}>
          {(() => {
            const roleThemes = themes.filter((t) => t.evidence?.includes(role.name));
            if (roleThemes.length === 0) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>暂无该角色的主题依据</span>;
            return roleThemes.slice(0, 5).map((t) => (
              <span key={t.name} className="jv-pill">
                <span className="jv-dot" style={{ '--dot': t.color } as React.CSSProperties} />
                {t.name} {t.value.toFixed(2)}
              </span>
            ));
          })()}
        </div>
      </div>
    </aside>
  );
}

function roleColor(family: string): string {
  const colors: Record<string, string> = {
    sheng: '#C41E3A', dan: '#2E5090', jing: '#C8A415', chou: '#1A1A1A',
  };
  return colors[family] || '#C41E3A';
}
