import { useRef, useEffect } from 'react';
import { select, scaleLinear, scalePoint, line } from 'd3';
import type { NarrativeStage } from '../../types';

interface Props {
  narrative: NarrativeStage[];
}

export function NarrativeLine({ narrative }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || narrative.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 470;
    const height = 326;
    const margin = { top: 30, right: 30, bottom: 40, left: 40 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = scalePoint<string>()
      .domain(narrative.map((n) => n.stage))
      .range([0, innerW]);

    const yScale = scaleLinear()
      .domain([0, 1])
      .range([innerH, 0]);

    // Grid
    g.selectAll('line.grid')
      .data([0.25, 0.5, 0.75])
      .join('line')
      .attr('class', 'grid')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', 'var(--border)')
      .attr('stroke-dasharray', '4 6');

    // Axes
    g.append('line').attr('x1', 0).attr('y1', innerH)
      .attr('x2', innerW).attr('y2', innerH)
      .attr('stroke', 'var(--border-strong)');
    g.append('line').attr('x1', 0).attr('y1', 0)
      .attr('x2', 0).attr('y2', innerH)
      .attr('stroke', 'var(--border-strong)');

    // Line
    const lineGenerator = line<NarrativeStage>()
      .x((d) => xScale(d.stage)!)
      .y((d) => yScale(d.value));

    g.append('path')
      .datum(narrative)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#C41E3A')
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    // Points
    g.selectAll('circle')
      .data(narrative)
      .join('circle')
      .attr('cx', (d) => xScale(d.stage)!)
      .attr('cy', (d) => yScale(d.value))
      .attr('r', 7)
      .attr('fill', '#C8A415')
      .attr('stroke', 'var(--surface-solid)')
      .attr('stroke-width', 3);

    // Stage labels
    g.selectAll('text.x-label')
      .data(narrative)
      .join('text')
      .attr('class', 'x-label')
      .attr('x', (d) => xScale(d.stage)!)
      .attr('y', innerH + 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', 'var(--muted)')
      .text((d) => d.stage);

    // Note labels above points
    g.selectAll('text.note')
      .data(narrative)
      .join('text')
      .attr('class', 'note')
      .attr('x', (d) => xScale(d.stage)!)
      .attr('y', (d) => yScale(d.value) - 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', 'var(--text)')
      .text((d) => d.note);

    // Y label
    g.append('text').attr('x', 10).attr('y', 10)
      .attr('font-size', 11).attr('fill', 'var(--muted)')
      .text('强度');

  }, [narrative]);

  return <svg ref={svgRef} width="100%" height="326" role="img" aria-label="叙事结构折线图" />;
}
