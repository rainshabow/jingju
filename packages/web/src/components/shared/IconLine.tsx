const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function IconLine({ name, size = 18 }: { name: string; size?: number }) {
  if (name === 'upload') {
    return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M12 16V5m0 0 4 4m-4-4-4 4M5 19h14" /></svg>;
  }
  if (name === 'info') {
    return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle {...common} cx="12" cy="12" r="8"/><path {...common} d="M12 11v5m0-8h.01"/></svg>;
  }
  if (name === 'back') {
    return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="m15 6-6 6 6 6"/><path {...common} d="M10 12h9"/></svg>;
  }
  if (name === 'expand') {
    return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/></svg>;
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle {...common} cx="12" cy="12" r="7" /></svg>;
}
