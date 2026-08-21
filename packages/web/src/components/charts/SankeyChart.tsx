import { useRef, useEffect, memo } from 'react';
import { select } from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { Character } from '../../types';

const ROLE_COLORS: Record<string, string> = {
  sheng: '#C41E3A', dan: '#2E5090', jing: '#C8A415', chou: '#1A1A1A',
};
const ROLE_LABELS: Record<string, string> = {
  sheng: '生', dan: '旦', jing: '净', chou: '丑',
};

interface Props {
  characters: Character[];
  highlightedChar: string | null;
  onSelectRole: (name: string | null) => void;
}

function SankeyChartInner({ characters, highlightedChar, onSelectRole }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onSelectRef = useRef(onSelectRole);
  onSelectRef.current = onSelectRole;

  useEffect(() => {
    if (!svgRef.current || characters.length === 0) return;
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const W = svgRef.current.clientWidth || 420;
    const H = 342;

    // Build graph data
    const featureSet = [...new Set(characters.map((c) => c.identity))];
    const typeSet = [...new Set(characters.map((c) => c.family))];
    const allNodes = [
      ...featureSet.map((n) => ({ name: n, cat: 'feature' as const })),
      ...typeSet.map((n) => ({ name: n, cat: 'roleType' as const })),
    ];

    const rawLinks: { source: number; target: number; value: number }[] = [];
    for (const ch of characters) {
      const s = allNodes.findIndex((n) => n.name === ch.identity);
      const t = allNodes.findIndex((n) => n.name === ch.family);
      const ex = rawLinks.find((l) => l.source === s && l.target === t);
      ex ? ex.value++ : rawLinks.push({ source: s, target: t, value: 1 });
    }

    const layout = d3Sankey<any, any>()
      .nodeWidth(32).nodePadding(14).extent([[24, 16], [W - 24, H - 40]]);

    const { nodes, links } = layout({
      nodes: allNodes.map((d) => ({ ...d })),
      links: rawLinks.map((l) => ({ ...l })),
    });

    // Defs for gradients
    const defs = svg.append('defs');
    typeSet.forEach((fam) => {
      const color = ROLE_COLORS[fam] || '#C8A415';
      defs.append('linearGradient').attr('id', `sankey-${fam}`)
        .attr('x1', '0').attr('y1', '0').attr('x2', '1').attr('y2', '0')
        .selectAll('stop').data([{ o: 0.15, p: '0%' }, { o: 0.65, p: '60%' }, { o: 0.85, p: '100%' }])
        .join('stop').attr('offset', (d) => d.p)
        .attr('stop-color', color).attr('stop-opacity', (d) => d.o);
    });

    // Links
    svg.append('g').selectAll('path').data(links).join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        const targetName = d.target?.name || nodes[d.target]?.name;
        return `url(#sankey-${targetName})`;
      })
      .attr('stroke-width', (d: any) => Math.max(2, d.width || 14))
      .attr('opacity', (d: any) => {
        if (!highlightedChar) return 0.75;
        const targetName = d.target?.name || nodes[d.target]?.name;
        const ch = characters.find((c) => c.family === targetName && c.name === highlightedChar);
        return ch ? 0.95 : 0.12;
      })
      .attr('stroke-linecap', 'round');

    // Nodes
    const nodeG = svg.append('g').selectAll('g').data(nodes).join('g');

    nodeG.append('rect')
      .attr('x', (d: any) => d.x0).attr('y', (d: any) => d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d: any) => {
        if (d.cat === 'feature') return 'var(--surface-muted)';
        return ROLE_COLORS[d.name] || '#C8A415';
      })
      .attr('rx', 6)
      .attr('stroke', 'var(--border)').attr('stroke-width', 1)
      .style('cursor', (d: any) => d.cat === 'roleType' ? 'pointer' : 'default')
      .attr('filter', (d: any) => (d.cat === 'roleType') ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))' : '')
      .on('click', (_: any, d: any) => {
        if (d.cat === 'roleType') {
          const ch = characters.find((c) => c.family === d.name);
          if (ch) onSelectRef.current(ch.name);
        }
      });

    // Node labels
    nodeG.append('text')
      .attr('x', (d: any) => d.cat === 'feature' ? d.x0 + 8 : d.x1 - 8)
      .attr('y', (d: any) => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.cat === 'feature' ? 'start' : 'end')
      .attr('font-size', 12).attr('font-weight', (d: any) => d.cat === 'roleType' ? 700 : 400)
      .attr('fill', (d: any) => d.cat === 'feature' ? 'var(--muted)' : '#fff')
      .text((d: any) => d.cat === 'roleType' ? ROLE_LABELS[d.name] || d.name : d.name);

    // Title
    svg.append('text').attr('x', 24).attr('y', H - 8)
      .attr('font-size', 10).attr('fill', 'var(--muted)')
      .text('流宽=角色数量；点击行当节点联动详情卡片。');

  }, [characters, highlightedChar]);

  return <svg ref={svgRef} className="jv-chart-svg" role="img" aria-label="行当桑基图" />;
}

export const SankeyChart = memo(SankeyChartInner);
