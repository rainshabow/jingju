import { useRef, useEffect } from 'react';
import { select } from 'd3';
import type { Character, Relation } from '../../types';
import { roleColor } from '../shared/RoleBadge';

interface Props {
  characters: Character[];
  relations: Relation[];
  highlight: string;
  onSelect: (name: string) => void;
}

// Generate circular layout positions dynamically
function getPositions(chars: Character[]): Record<string, [number, number]> {
  const map: Record<string, [number, number]> = {};
  const cx = 280, cy = 163, radius = 120;
  chars.forEach((c, i) => {
    const angle = (i / chars.length) * 2 * Math.PI - Math.PI / 2;
    map[c.name] = [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
  return map;
}

export function DetailNetwork({ characters, relations, highlight, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || characters.length === 0) return;
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 560, height = 326;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Shadow filter
    const defs = svg.append('defs');
    defs.append('filter').attr('id', 'nodeShadow')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 6).attr('stdDeviation', 5)
      .attr('floodColor', '#1a1a1a').attr('floodOpacity', 0.18);

    const posMap = getPositions(characters);

    // Draw edges
    relations.forEach((rel) => {
      const a = posMap[rel.from], b = posMap[rel.to];
      if (!a || !b) return;
      const active = rel.from === highlight || rel.to === highlight;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;

      svg.append('line')
        .attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1])
        .attr('stroke', strokeColor(rel.type))
        .attr('stroke-width', 2 + rel.strength * 5)
        .attr('stroke-linecap', 'round')
        .attr('opacity', active ? 1 : 0.15);

      svg.append('rect')
        .attr('x', mx - 26).attr('y', my - 13).attr('width', 52).attr('height', 22)
        .attr('rx', 11).attr('fill', 'var(--surface-solid)')
        .attr('stroke', 'var(--border)').attr('opacity', active ? 1 : 0.15);

      svg.append('text')
        .attr('x', mx).attr('y', my + 4).attr('text-anchor', 'middle')
        .attr('font-size', 11).attr('fill', 'var(--muted)').text(rel.type);
    });

    // Draw nodes
    characters.forEach((role) => {
      const pos = posMap[role.name];
      if (!pos) return;
      const [x, y] = pos;
      const active = role.name === highlight;

      const g = svg.append('g')
        .style('cursor', 'pointer')
        .on('click', () => onSelect(role.name))
        .attr('opacity', active ? 1 : 0.65);

      g.append('circle')
        .attr('cx', x).attr('cy', y)
        .attr('r', active ? 32 : 22)
        .attr('fill', roleColor(role.family))
        .attr('stroke', 'var(--surface-solid)')
        .attr('stroke-width', active ? 5 : 3)
        .attr('filter', 'url(#nodeShadow)');

      g.append('text')
        .attr('x', x).attr('y', y + 5).attr('text-anchor', 'middle')
        .attr('fill', '#fff').attr('font-size', active ? 14 : 12)
        .attr('font-weight', 700).text(role.name);

      g.append('text')
        .attr('x', x).attr('y', y + (active ? 46 : 38))
        .attr('text-anchor', 'middle').attr('font-size', 11)
        .attr('fill', 'var(--muted)').text(role.roleType);
    });

    // Hint
    svg.append('text')
      .attr('x', 24).attr('y', height - 6)
      .attr('font-size', 11).attr('fill', 'var(--muted)')
      .text('粗线=强互动；标签=关系类型；点击节点切换审阅对象。');
  }, [characters, relations, highlight, onSelect]);

  return <svg ref={svgRef} width="100%" height="326" role="img" aria-label="单剧本关系网络" />;
}

function strokeColor(type: string): string {
  const c: Record<string, string> = { '爱情': '#2E5090', '敌对': '#C41E3A', '君臣': '#C8A415', '宗亲': '#2D6A4F' };
  return c[type] || '#756A5C';
}
