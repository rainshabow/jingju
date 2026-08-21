import type { ReactNode } from 'react';

interface Metric {
  label: string;
  value: string;
}

interface Props {
  kicker: string;
  title: string;
  note: string;
  metrics: Metric[];
  action?: ReactNode;
  children: ReactNode;
}

export function PanelShell({ kicker, title, note, metrics, action, children }: Props) {
  return (
    <section className="jv-panel">
      <div className="jv-panel-header">
        <div>
          <div className="jv-panel-kicker">{kicker}</div>
          <div className="jv-panel-title">{title}</div>
          <div className="jv-panel-note">{note}</div>
        </div>
        {action}
      </div>
      <div className="jv-chart-area">{children}</div>
      <div className="jv-divider-ink" />
      <div className="jv-metrics">
        {metrics.map((m) => (
          <div key={m.label} className="jv-metric">
            <b>{m.value}</b>
            <span>{m.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
