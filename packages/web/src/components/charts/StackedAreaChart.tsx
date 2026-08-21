import { useRef, useEffect } from 'react';
import { select, stack, stackOrderReverse, area, scalePoint, scaleLinear } from 'd3';

const ROLE_COLORS: Record<string, string> = {
  sheng: '#C41E3A', dan: '#2E5090', jing: '#C8A415', chou: '#1A1A1A',
};
const LABELS: Record<string, string> = { sheng: '生', dan: '旦', jing: '净', chou: '丑' };

interface EraDatum { era: string; sheng: number; dan: number; jing: number; chou: number }

interface Props {
  data: EraDatum[];
}

const ERA_ORDER: Record<string, number> = { '清代': 0, '清末': 1, '民国': 2, '当代整理': 3, '当代': 3 };

export function StackedAreaChart({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const sorted = [...data].sort((a, b) => (ERA_ORDER[a.era] ?? 99) - (ERA_ORDER[b.era] ?? 99));

    const width = svgRef.current.clientWidth || 420;
    const height = 342;
    const m = { top: 20, right: 20, bottom: 34, left: 24 };

    const keys = ['chou', 'jing', 'dan', 'sheng'];
    const stackGen = stack<EraDatum>().keys(keys).order(stackOrderReverse);
    const layers = stackGen(sorted);

    const x = scalePoint<string>().domain(sorted.map((d) => d.era)).range([m.left, width - m.right]);
    const y = scaleLinear().domain([0, 1]).range([height - m.bottom, m.top]);

    const areaGen = area<[number, number]>()
      .x((_, i) => x(sorted[i].era)!)
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]));

    const g = svg.append('g');

    // Grid
    g.selectAll('line.grid').data([0.25, 0.5, 0.75])
      .join('line').attr('stroke', 'var(--border)').attr('stroke-dasharray', '4 6')
      .attr('x1', m.left).attr('x2', width - m.right)
      .attr('y1', (d) => y(d)).attr('y2', (d) => y(d));
    g.append('line').attr('x1', m.left).attr('x2', width - m.right)
      .attr('y1', height - m.bottom).attr('y2', height - m.bottom)
      .attr('stroke', 'var(--border-strong)');

    // Areas with gradient
    layers.forEach((layer, i) => {
      const color = ROLE_COLORS[layer.key] || '#C41E3A';
      // Fade-in with delay
      const areaPath = g.append('path')
        .datum(layer)
        .attr('d', areaGen)
        .attr('fill', color)
        .attr('opacity', 0)
        .transition().duration(600).delay(i * 120)
        .attr('opacity', 0.72);

      // Top edge accent line
      const topLine = layer.map((d) => ({ x: x(d.data.era)!, y: y(d[1]) }));
      g.append('path')
        .datum(topLine)
        .attr('d', area().x((d: any) => d.x).y0(height - m.bottom).y1((d: any) => d.y))
        .attr('fill', 'none').attr('stroke', color)
        .attr('stroke-width', 2).attr('stroke-opacity', 0.3)
        .attr('opacity', 0).transition().duration(600).delay(i * 120)
        .attr('opacity', 0.6);
    });

    // X labels
    g.selectAll('text.xl').data(sorted).join('text')
      .attr('x', (d) => x(d.era)!).attr('y', height - 8)
      .attr('text-anchor', 'middle').attr('font-size', 11)
      .attr('fill', 'var(--muted)').text((d) => d.era);

    // Legend
    keys.forEach((k, i) => {
      g.append('circle').attr('cx', m.left + i * 48).attr('cy', 10)
        .attr('r', 5).attr('fill', ROLE_COLORS[k]);
      g.append('text').attr('x', m.left + i * 48 + 9).attr('y', 14)
        .attr('font-size', 11).attr('fill', 'var(--muted)').text(LABELS[k]);
    });

    // Insight
    svg.append('text').attr('x', m.left).attr('y', height - 18)
      .attr('font-size', 10).attr('fill', 'var(--muted)')
      .text('清末至民国，旦行占比持续上升；净行在清代占比最高。');

  }, [data]);

  return <svg ref={svgRef} className="jv-chart-svg" role="img" aria-label="行当年代分布堆叠面积图" />;
}
