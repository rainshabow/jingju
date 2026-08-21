import type { NetworkTemplate } from '../../types';

interface Props {
  templates: NetworkTemplate[];
}

export function NetworkTemplatesView({ templates }: Props) {
  const forms: Record<string, { nodes: [number, number][], links: [number, number][] }> = {
    '星型': {
      nodes: [[150, 30], [60, 30], [240, 30], [112, 16], [188, 16]],
      links: [[0, 1], [0, 2], [0, 3], [0, 4]],
    },
    '团簇型': {
      nodes: [[150, 28], [120, 12], [180, 12], [100, 44], [160, 44], [200, 44]],
      links: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5]],
    },
    '二极型': {
      nodes: [[150, 28], [110, 8], [190, 8], [110, 48], [190, 48]],
      links: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]],
    },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, padding: 8 }}>
      {templates.map((t, i) => {
        const fm = forms[t.form] || forms['星型'];
        return (
          <div key={t.type} style={{
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-solid)', padding: 10,
            animation: `panelIn .4s ease ${i * 0.1}s both`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <strong style={{ fontSize: 13 }}>{t.type}</strong>
              <span style={{ color: 'var(--muted)', fontSize: 11 }}>{t.form}</span>
            </div>
            <svg width="100%" height="46" viewBox="0 0 280 56">
              {fm.links.map(([s, t], j) => (
                <line key={`${s}-${t}`}
                  x1={fm.nodes[s][0]} y1={fm.nodes[s][1]}
                  x2={fm.nodes[t][0]} y2={fm.nodes[t][1]}
                  stroke="var(--border-strong)" strokeWidth={0.8} />
              ))}
              {fm.nodes.map(([x, y], j) => (
                <circle key={j} cx={x} cy={y} r={j === 0 ? 6 : 3.5}
                  fill={j === 0 ? '#C41E3A' : '#2E5090'}
                  opacity={0.85} />
              ))}
            </svg>
            <div className="jv-pill-row" style={{ marginTop: 4 }}>
              <span className="jv-pill" style={{ fontSize: 10 }}>密度 {t.density}</span>
              <span className="jv-pill" style={{ fontSize: 10 }}>聚类 {t.cluster}</span>
              <span className="jv-pill" style={{ fontSize: 10 }}>中心 {t.center}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
