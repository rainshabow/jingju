import { useRef, useEffect } from 'react';
import { select } from 'd3';

interface CooccurLink {
  source: string;
  target: string;
  value: number;
}

interface Props {
  links: CooccurLink[];
  bundles: Array<{ name: string; themes: string; plays: number }>;
}

const BUNDLE_COLORS = ['#C41E3A', '#2E5090', '#C8A415'];

export function ThemeCooccurrence({ links, bundles }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || links.length === 0) return;
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 420;
    const height = 220;
    const cx = width / 2, cy = height / 2;

    // Position themes in circle
    const themes = [...new Set(links.flatMap((l) => [l.source, l.target]))];
    const radius = Math.min(cx, cy) - 30;
    const positions: Record<string, [number, number]> = {};
    themes.forEach((t, i) => {
      const angle = (i / themes.length) * 2 * Math.PI - Math.PI / 2;
      positions[t] = [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
    });

    // Links
    links.forEach((l) => {
      const a = positions[l.source], b = positions[l.target];
      if (!a || !b) return;
      svg.append('line')
        .attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1])
        .attr('stroke', '#C8A415').attr('stroke-width', 1 + l.value * 6)
        .attr('stroke-opacity', 0.15 + l.value * 0.5)
        .attr('stroke-linecap', 'round');
    });

    // Node circles
    themes.forEach((t, i) => {
      const [x, y] = positions[t];
      const g = svg.append('g');
      g.append('circle').attr('cx', x).attr('cy', y).attr('r', 14)
        .attr('fill', 'var(--surface-solid)').attr('stroke', 'var(--border-strong)').attr('stroke-width', 1.5);
      g.append('circle').attr('cx', x).attr('cy', y).attr('r', 8)
        .attr('fill', BUNDLE_COLORS[i % 3]).attr('opacity', 0.7);
      g.append('text').attr('x', x).attr('y', y + 26)
        .attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', 'var(--text)')
        .text(t);
    });
  }, [links]);

  return (
    <div>
      <svg ref={svgRef} width="100%" height="220" role="img" aria-label="主题共现网络" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, padding: '0 12px 8px' }}>
        {bundles.map((b, i) => (
          <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: BUNDLE_COLORS[i], flexShrink: 0 }} />
            <span style={{ color: 'var(--muted)' }}>{b.name}</span>
            <strong>{b.themes}</strong>
            <span style={{ color: 'var(--muted)', marginLeft: 'auto' }}>{b.plays} 本</span>
          </div>
        ))}
      </div>
    </div>
  );
}
