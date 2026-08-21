import type { Character } from '../../types';
import { RoleBadge, roleColor } from '../shared/RoleBadge';

interface Props {
  characters: Character[];
  highlight: string;
  onSelect: (name: string) => void;
}

export function RoleTable({ characters, highlight, onSelect }: Props) {
  const counts = {
    sheng: characters.filter((c) => c.family === 'sheng').length,
    dan: characters.filter((c) => c.family === 'dan').length,
    jing: characters.filter((c) => c.family === 'jing').length,
    chou: characters.filter((c) => c.family === 'chou').length,
  };

  return (
    <section className="jv-section-card">
      <div className="jv-section-head">
        <div>
          <div className="jv-section-title">角色一览表</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
            点击行可同步高亮下方关系网络和主题证据。
          </div>
        </div>
        <div className="jv-pill-row">
          <RoleBadge family="sheng">生 {counts.sheng}</RoleBadge>
          <RoleBadge family="dan">旦 {counts.dan}</RoleBadge>
          <RoleBadge family="jing">净 {counts.jing}</RoleBadge>
          <RoleBadge family="chou">丑 {counts.chou}</RoleBadge>
        </div>
      </div>
      <table className="jv-table">
        <thead>
          <tr>
            <th>角色</th><th>性别</th><th>年龄</th><th>身份</th>
            <th>性格</th><th>表演风格</th><th>行当</th><th>置信度</th>
          </tr>
        </thead>
        <tbody>
          {characters.map((role) => (
            <tr key={role.name} onClick={() => onSelect(role.name)}
              style={{ cursor: 'pointer' }}>
              <td><strong>{role.name}</strong></td>
              <td>{role.gender}</td>
              <td>{role.age}</td>
              <td>{role.identity}</td>
              <td>{role.personality}</td>
              <td>{role.performance}</td>
              <td><RoleBadge family={role.family}>{role.roleType}</RoleBadge></td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{role.confidence.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
