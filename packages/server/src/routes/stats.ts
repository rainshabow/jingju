import { FastifyInstance } from 'fastify';
import { db, sqlite } from '../db/index.js';
import { themes } from '../db/schema.js';

export async function statsRoutes(app: FastifyInstance) {
  app.get('/stats/role-types', async () => {
    const summary = sqlite.prepare(
      `SELECT role_type AS label, count(*) AS count FROM characters GROUP BY role_type`
    ).all();

    const eraRows = sqlite.prepare(
      `SELECT COALESCE(p.era, '未知') AS era, c.role_type AS roleType
       FROM characters c JOIN plays p ON c.play_id = p.id`
    ).all() as { era: string; roleType: string }[];

    const eraCounts: Record<string, Record<string, number>> = {};
    for (const row of eraRows) {
      if (!eraCounts[row.era]) eraCounts[row.era] = { sheng: 0, dan: 0, jing: 0, chou: 0 };
      if (row.roleType === '生') eraCounts[row.era].sheng++;
      else if (row.roleType === '旦') eraCounts[row.era].dan++;
      else if (row.roleType === '净') eraCounts[row.era].jing++;
      else if (row.roleType === '丑') eraCounts[row.era].chou++;
    }
    const eraTrend = Object.entries(eraCounts).map(([era, counts]) => {
      const total = counts.sheng + counts.dan + counts.jing + counts.chou || 1;
      return { era, sheng: +(counts.sheng / total).toFixed(2), dan: +(counts.dan / total).toFixed(2), jing: +(counts.jing / total).toFixed(2), chou: +(counts.chou / total).toFixed(2) };
    });

    const heatmap = (summary as any[]).map((r: any) => ({ identity: r.label, family: r.label, value: r.count }));
    return { roleSummary: summary, eraTrend, heatmap };
  });

  app.get('/stats/themes', async () => {
    const allThemes = await db
      .select({ playId: themes.playId, themeName: themes.themeName })
      .from(themes);

    const playThemes = new Map<number, Set<string>>();
    for (const t of allThemes) {
      if (!playThemes.has(t.playId)) playThemes.set(t.playId, new Set());
      playThemes.get(t.playId)!.add(t.themeName);
    }

    const totalPlays = playThemes.size;
    if (totalPlays === 0) return { cooccurrence: [], bundles: [] };

    const names = [...new Set(allThemes.map((t) => t.themeName))];
    const pairCounts = new Map<string, number>();

    for (const [, themeSet] of playThemes) {
      const arr = [...themeSet];
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const key = [arr[i], arr[j]].sort().join('||');
          pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
        }
      }
    }

    const cooccurrence: { source: string; target: string; value: number }[] = [];
    for (const [key, count] of pairCounts) {
      const [a, b] = key.split('||');
      cooccurrence.push({ source: a, target: b, value: Math.round(count / totalPlays * 100) / 100 });
    }

    cooccurrence.sort((a, b) => b.value - a.value);
    const bundles = cooccurrence.slice(0, 5).map((c) => ({
      name: `${c.source}+${c.target}组合`,
      themes: `${c.source} + ${c.target}`,
      plays: pairCounts.get([c.source, c.target].sort().join('||')) || 0,
    }));

    return { cooccurrence, bundles };
  });

  app.get('/stats/networks', async () => {
    // 按剧目类型分组，计算真实网络指标
    const groups = sqlite.prepare(`
      SELECT p.genre, p.id AS play_id
      FROM plays p
      WHERE p.genre IS NOT NULL AND p.genre != ''
      AND EXISTS (SELECT 1 FROM characters WHERE play_id = p.id)
    `).all() as { genre: string; play_id: number }[];

    const genreMap = new Map<string, number[]>();
    for (const g of groups) {
      if (!genreMap.has(g.genre)) genreMap.set(g.genre, []);
      genreMap.get(g.genre)!.push(g.play_id);
    }

    const result: { type: string; form: string; density: number; cluster: number; center: string }[] = [];

    for (const [genre, playIds] of genreMap) {
      const idList = playIds.join(',');

      // 节点数 + 边数（跨剧本汇总）
      const stats = sqlite.prepare(`
        SELECT
          (SELECT count(DISTINCT name) FROM characters WHERE play_id IN (${idList})) AS nodes,
          (SELECT count(*) FROM relations WHERE play_id IN (${idList})) AS edges
      `).get() as { nodes: number; edges: number };

      // 网络密度 = 边数 / 最大可能边数
      const maxEdges = stats.nodes * (stats.nodes - 1) / 2;
      const density = maxEdges > 0 ? Math.round(stats.edges / maxEdges * 100) / 100 : 0;

      // 聚类系数：每个角色实际邻居间连接数 / 可能连接数
      const cluster = computeClusterCoeff(idList, stats.nodes);

      // 中心人物：度最高的角色
      const center = sqlite.prepare(`
        SELECT c.name
        FROM characters c
        WHERE c.play_id IN (${idList})
        ORDER BY c.centrality DESC
        LIMIT 1
      `).get() as { name: string } | undefined;

      // 拓扑类型判定（基于密度和聚类系数）
      const form = density > 0.4 ? '团簇型' : density > 0.25 ? '二极型' : '星型';

      result.push({
        type: genre,
        form,
        density,
        cluster,
        center: center?.name || '-',
      });
    }

    return result.length > 0 ? result : [
      { type: '暂无分类数据', form: '-', density: 0, cluster: 0, center: '-' },
    ];
  });
}

/** 计算指定剧本集的平均聚类系数（简化：邻居间实际边 / 可能边） */
function computeClusterCoeff(idList: string, nodeCount: number): number {
  if (nodeCount < 3) return 0;

  // 获取所有关系边
  const edges = sqlite.prepare(`
    SELECT char_a, char_b FROM relations WHERE play_id IN (${idList})
  `).all() as { char_a: string; char_b: string }[];

  // 构建邻接表
  const adj = new Map<string, Set<string>>();
  for (const { char_a, char_b } of edges) {
    if (!adj.has(char_a)) adj.set(char_a, new Set());
    if (!adj.has(char_b)) adj.set(char_b, new Set());
    adj.get(char_a)!.add(char_b);
    adj.get(char_b)!.add(char_a);
  }

  // 边集合（快速查两节点是否相连）
  const edgeSet = new Set(edges.map((e) => [e.char_a, e.char_b].sort().join('||')));

  let totalCoeff = 0;
  let nodesWithNeighbors = 0;

  for (const [node, neighbors] of adj) {
    const n = neighbors.size;
    if (n < 2) continue;
    nodesWithNeighbors++;

    const nbArr = [...neighbors];
    let connectedPairs = 0;
    for (let i = 0; i < nbArr.length; i++) {
      for (let j = i + 1; j < nbArr.length; j++) {
        if (edgeSet.has([nbArr[i], nbArr[j]].sort().join('||'))) {
          connectedPairs++;
        }
      }
    }
    const maxPairs = n * (n - 1) / 2;
    totalCoeff += connectedPairs / maxPairs;
  }

  if (nodesWithNeighbors === 0) return 0;
  return Math.round(totalCoeff / nodesWithNeighbors * 100) / 100;
}
