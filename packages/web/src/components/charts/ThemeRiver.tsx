import { useRef, useEffect, memo } from 'react';
import { select, stack, stackOffsetWiggle, stackOrderInsideOut, area } from 'd3';
import type { Theme } from '../../types';

interface Props {
  themes: Theme[];
  stages: string[];
  highlightedTheme: string | null;
  onSelectTheme: (name: string | null) => void;
}

function ThemeRiverInner({ themes, stages, highlightedTheme, onSelectTheme }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onSelectRef = useRef(onSelectTheme);
  onSelectRef.current = onSelectTheme;

  useEffect(() => {
    if (!svgRef.current || themes.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 420;
    const height = 342;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Build data series
    const seriesData = stages.map((_, stageIdx) => {
      const row: Record<string, number> = {};
      for (const theme of themes) {
        row[theme.name] = theme.stages[stageIdx] || 0;
      }
      return row;
    });

    const keys = themes.map((t) => t.name);
    const colorMap: Record<string, string> = {};
    for (const t of themes) {
      colorMap[t.name] = t.color;
    }

    const stackGenerator = stack()
      .keys(keys)
      .offset(stackOffsetWiggle)
      .order(stackOrderInsideOut);

    const stackedData = stackGenerator(seriesData);

    const xScale = (d: number) => (d / (stages.length - 1)) * innerW;
    const yScale = (val: number) => (val / 2) * innerH + innerH / 2;

    const areaGenerator = area<[number, number]>()
      .x((_d, i) => xScale(i))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]));

    // Draw rivers
    g.selectAll('path')
      .data(stackedData)
      .join('path')
      .attr('d', (d: any) => areaGenerator(d as any))
      .attr('fill', (d: any) => colorMap[d.key] || '#C8A415')
      .attr('opacity', (d) => {
        if (!highlightedTheme) return 0.72;
        return d.key === highlightedTheme ? 0.85 : 0.15;
      })
      .style('cursor', 'pointer')
      .on('click', (_event, d: any) => {
        onSelectRef.current(d.key === highlightedTheme ? null : d.key);
      });

    // Stage labels on X axis
    g.selectAll('text.stage-label')
      .data(stages)
      .join('text')
      .attr('class', 'stage-label')
      .attr('x', (_d, i) => xScale(i))
      .attr('y', innerH + 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', 'var(--muted)')
      .text((d) => d);

    // Axis line
    g.append('line')
      .attr('x1', 0).attr('y1', innerH / 2)
      .attr('x2', innerW).attr('y2', innerH / 2)
      .attr('stroke', 'var(--border-strong)')
      .attr('stroke-dasharray', '4 6');

    // Hint
    svg.append('text')
      .attr('x', margin.left)
      .attr('y', height - 6)
      .attr('font-size', 10)
      .attr('fill', 'var(--muted)')
      .text('河流宽度表示主题在叙事阶段中的强度；点击可联动。');

  }, [themes, stages, highlightedTheme]);

  return (
    <svg ref={svgRef} className="jv-chart-svg" role="img" aria-label="主题河流图" />
  );
}

export const ThemeRiver = memo(ThemeRiverInner);
