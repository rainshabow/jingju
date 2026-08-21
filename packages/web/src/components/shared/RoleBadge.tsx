import type { ReactNode } from 'react';

const COLORS: Record<string, string> = {
  sheng: '#C41E3A', dan: '#2E5090', jing: '#C8A415', chou: '#1A1A1A',
};

export function RoleBadge({ family, children }: { family: string; children?: ReactNode }) {
  return (
    <span className="jv-pill">
      <span className="jv-dot" style={{ '--dot': COLORS[family] || '#C41E3A' } as React.CSSProperties} />
      {children || familyLabels(family)}
    </span>
  );
}

function familyLabels(family: string): string {
  const labels: Record<string, string> = { sheng: '生', dan: '旦', jing: '净', chou: '丑' };
  return labels[family] || '生';
}

export function roleColor(family: string): string {
  return COLORS[family] || '#C41E3A';
}

export function relationColor(type: string): string {
  const colors: Record<string, string> = {
    '爱情': '#2E5090', '敌对': '#C41E3A', '君臣': '#C8A415', '宗亲': '#2D6A4F',
  };
  return colors[type] || '#756A5C';
}
