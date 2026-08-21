import type { Theme } from '../../types';

interface Props {
  themes: Theme[];
  onSelect?: (name: string) => void;
}

export function ThemeBars({ themes, onSelect }: Props) {
  const maxValue = Math.max(...themes.map((t) => t.value));

  return (
    <div className="jv-bars">
      {themes.map((theme) => (
        <div key={theme.name} className="jv-bar-row"
          style={{ cursor: onSelect ? 'pointer' : 'default' }}
          onClick={() => onSelect?.(theme.name)}>
          <strong>{theme.name}</strong>
          <span className="jv-bar-track">
            <span className="jv-bar-fill" style={{
              width: `${(theme.value / maxValue * 100).toFixed(0)}%`,
              background: theme.color,
            }} />
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            {theme.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
