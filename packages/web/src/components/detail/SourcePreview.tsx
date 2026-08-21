import { useState, useMemo } from 'react';
import type { Character, Theme, Relation } from '../../types';

interface Props {
  selected: Character;
  fullText: string;
  themes: Theme[];
  relations: Relation[];
}

/** Strip HTML tags and decode entities, normalize whitespace */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract paragraphs from fullText that mention the given name */
function findMatchingParagraphs(text: string, name: string): { page: number; text: string }[] {
  if (!text || !name) return [];

  const pageParts = text.split(/--- 第 (\d+) 页 ---/);
  const results: { page: number; text: string }[] = [];

  for (let i = 1; i < pageParts.length; i += 2) {
    const pageNum = parseInt(pageParts[i], 10);
    const content = pageParts[i + 1]?.trim() || '';
    const lines = content.split('\n').filter(Boolean);
    const matchedLines = lines.filter((line) => stripHtml(line).includes(name));
    for (const line of matchedLines) {
      results.push({ page: pageNum, text: stripHtml(line) });
    }
  }
  return results;
}

export function SourcePreview({ selected, fullText, themes, relations }: Props) {
  const [expanded, setExpanded] = useState(false);

  const matches = useMemo(
    () => findMatchingParagraphs(fullText, selected.name),
    [fullText, selected.name],
  );
  const visible = expanded ? matches : matches.slice(0, 3);

  const fallbackPreviews = themes.slice(0, 3).map((t) => t.evidence);

  const footnotes: { code: string; title: string; text: string }[] = [];
  const relEvidence = relations.find((r) => r.evidence);
  if (relEvidence) {
    footnotes.push({
      code: 'R-001',
      title: '关系依据',
      text: relEvidence.evidence.slice(0, 120) + (relEvidence.evidence.length > 120 ? '…' : ''),
    });
  }
  themes.slice(0, 2).forEach((t, i) => {
    if (t.evidence) {
      footnotes.push({
        code: `T-00${i + 1}`,
        title: `主题「${t.name}」依据`,
        text: t.evidence.slice(0, 120) + (t.evidence.length > 120 ? '…' : ''),
      });
    }
  });
  if (footnotes.length < 3) {
    footnotes.push({
      code: 'C-001',
      title: '置信度',
      text: `${selected.name} 行当 ${selected.roleType}，置信度 ${Math.round((selected.confidence || 0) * 100)}%，基于身份"${selected.identity}"与表演风格"${selected.performance}"推断。`,
    });
  }

  return (
    <section className="jv-section-card">
      <div className="jv-section-head">
        <div>
          <div className="jv-section-title">原文预览</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
            当前高亮：{selected.name}。{matches.length > 0 ? `原文匹配 ${matches.length} 处` : '无原文匹配，以下为 AI 分析摘要'}
          </div>
        </div>
        {matches.length > 3 && (
          <button className="jv-button small" onClick={() => setExpanded(!expanded)}>
            {expanded ? '收起' : `展开全部 (${matches.length})`}
          </button>
        )}
      </div>

      <div className="jv-accordion">
        {matches.length > 0 ? (
          <>
            <blockquote className="jv-quote">
              {visible.map((m, i) => (
                <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0', lineHeight: 1.8 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--opera-red)',
                    marginRight: 8, background: 'rgba(196,30,58,.06)', padding: '1px 6px',
                    borderRadius: 3,
                  }}>
                    P{m.page}
                  </span>
                  {m.text}
                </p>
              ))}
            </blockquote>
            {!expanded && matches.length > 3 && (
              <div style={{ textAlign: 'center', padding: '8px 0', color: 'var(--muted)', fontSize: 12 }}>
                还有 {matches.length - 3} 处匹配未显示
              </div>
            )}
          </>
        ) : (
          <blockquote className="jv-quote">
            {fallbackPreviews.map((line, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0' }}>{line}</p>
            ))}
          </blockquote>
        )}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10, marginTop: 16, paddingTop: 12,
          borderTop: '1px solid var(--border)',
        }}>
          {footnotes.map((fn) => (
            <FootnoteCard key={fn.code} {...fn} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FootnoteCard({ code, title, text }: { code: string; title: string; text: string }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      padding: 12, background: 'var(--surface-solid)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--opera-red)', fontSize: 11 }}>{code}</div>
      <strong style={{ display: 'block', marginTop: 5 }}>{title}</strong>
      <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}
