import { useRef, useEffect, memo, useCallback } from 'react';
import {
  select, forceSimulation, forceLink, forceManyBody,
  forceCenter, forceCollide, zoom, drag as d3Drag,
} from 'd3';
import type { Character, Relation } from '../../types';
import { roleColor } from '../shared/RoleBadge';

interface LinkDatum {
  source: string;
  target: string;
  type: string;
  strength: number;
  evidence: string;
}

interface Props {
  characters: Character[];
  relations: Relation[];
  highlightedChar: string | null;
  onSelectRole: (name: string | null) => void;
}

function ForceGraphInner({ characters, relations, highlightedChar, onSelectRole }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onSelectRef = useRef(onSelectRole);
  onSelectRef.current = onSelectRole;

  useEffect(() => {
    if (!svgRef.current || characters.length === 0) return;
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 420;
    const height = 342;
    const g = svg.append('g');

    const zoomB = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => { g.attr('transform', event.transform); });
    svg.call(zoomB);

    const nodes: (Character & { x?: number; y?: number })[] = characters.map((c) => ({ ...c }));
    const links: LinkDatum[] = relations.map((r) => ({
      source: r.from, target: r.to, type: r.type,
      strength: r.strength, evidence: r.evidence,
    }));

    const sim = forceSimulation(nodes)
      .force('link', forceLink<Character, LinkDatum>(links).id((d) => d.name).distance(90).strength((d) => d.strength * 0.5))
      .force('charge', forceManyBody().strength(-220))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(35));

    // Defs & link gradient
    const defs = svg.append('defs');
    defs.append('filter').attr('id', 'glow').append('feDropShadow')
      .attr('dx', 0).attr('dy', 2).attr('stdDeviation', 4).attr('floodColor', '#1a1a1a').attr('floodOpacity', 0.25);

    // Links
    const linkG = g.append('g');
    const linkEls = linkG.selectAll('line').data(links).join('line')
      .attr('stroke', (d) => relStroke(d.type))
      .attr('stroke-width', (d) => 1 + d.strength * 5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-opacity', 0.35);

    // Link labels
    const labelG = g.append('g');
    const linkLabels = labelG.selectAll('text').data(links).join('text')
      .attr('font-size', 9).attr('fill', 'var(--muted)').attr('text-anchor', 'middle')
      .attr('dy', -2).text((d) => d.type);

    // Nodes
    const nodeG = g.append('g');
    const nodeEls = nodeG.selectAll('g').data(nodes).join('g')
      .style('cursor', 'pointer')
      .on('click', (_e, d) => onSelectRef.current(d.name === highlightedChar ? null : d.name))
      .call(dragFn(sim));

    // Outer ring
    nodeEls.append('circle')
      .attr('r', (d) => 18 + d.centrality * 14)
      .attr('fill', 'none')
      .attr('stroke', (d) => (highlightedChar && d.name !== highlightedChar) ? 'transparent' : roleColor(d.family))
      .attr('stroke-width', 2).attr('stroke-opacity', 0.2)
      .filter((d) => d.name === highlightedChar ? 'url(#glow)' : '');

    // Main bubble
    nodeEls.append('circle')
      .attr('r', (d) => 14 + d.centrality * 12)
      .attr('fill', (d) => roleColor(d.family))
      .attr('stroke', 'var(--surface-solid)')
      .attr('stroke-width', (d) => d.name === highlightedChar ? 4 : 2.5)
      .attr('filter', (d) => d.name === highlightedChar ? 'url(#glow)' : '')
      .attr('opacity', (d) => (highlightedChar && d.name !== highlightedChar) ? 0.35 : 1);

    // Name badge
    nodeEls.append('text')
      .attr('text-anchor', 'middle').attr('dy', 4)
      .attr('fill', '#fff').attr('font-size', 11).attr('font-weight', 700)
      .text((d) => d.name.slice(0, 2));

    // Full name label below
    nodeEls.append('text')
      .attr('text-anchor', 'middle').attr('y', (d) => 22 + d.centrality * 12)
      .attr('fill', 'var(--muted)').attr('font-size', 10)
      .text((d) => d.name);

    // Tick
    sim.on('tick', () => {
      linkEls.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      linkLabels.attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
      nodeEls.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [characters, relations, highlightedChar]); // onSelectRole 用 ref 稳定，不作为 deps

  return <svg ref={svgRef} className="jv-chart-svg" role="img" aria-label="角色关系力导向图" />;
}

export const ForceGraph = memo(ForceGraphInner);

function relStroke(type: string): string {
  const c: Record<string, string> = { '爱情': '#2E5090', '敌对': '#C41E3A', '君臣': '#C8A415', '宗亲': '#2D6A4F' };
  return c[type] || '#756A5C';
}

function dragFn(sim: any) {
  return d3Drag<any, any>()
    .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
    .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
}
