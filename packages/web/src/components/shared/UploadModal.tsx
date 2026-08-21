import { useState, useRef, useEffect } from 'react';
import { api } from '../../api';

interface Props {
  onClose: () => void;
  onUploaded?: (playId: number) => void;
}

export function UploadModal({ onClose, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playId, setPlayId] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'ocr' | 'llm' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const steps = [
    { label: '上传 PDF', key: 'upload' as const },
    { label: 'OCR 文本提取', key: 'ocr' as const },
    { label: 'AI 角色关系主题分析', key: 'llm' as const },
    { label: '完成', key: 'done' as const },
  ];

  const stepStatus = (key: string) => {
    if (status === 'error') return key === 'upload' ? 'done' : 'pending';
    if (status === 'done' || progress >= 100) return 'done';
    // 按进度判断当前阶段
    if (progress < 10) return key === 'upload' ? 'active' : 'pending';
    if (progress < 36) return key === 'upload' ? 'done' : key === 'ocr' ? 'active' : 'pending';
    return key === 'upload' ? 'done' : key === 'ocr' ? 'done' : key === 'llm' ? 'active' : 'pending';
  };

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    setStatus('ocr');
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setPlayId(data.id);
      setProgress(30);

      // 轮询状态
      pollRef.current = setInterval(async () => {
        try {
          const s = await api.analyzeStatus(String(data.id));
          setProgress(s.progress || progress);
          if (s.status === 'done') {
            setStatus('done');
            setProgress(100);
            clearInterval(pollRef.current);
            if (onUploaded) onUploaded(data.id);
          } else if (s.status === 'failed') {
            setStatus('error');
            setError('分析失败，请重试');
            clearInterval(pollRef.current);
          }
        } catch {}
      }, 2000);
    } catch (e: any) {
      setStatus('error');
      setError(e.message || '上传失败');
    }
  }

  return (
    <div className="jv-modal-backdrop">
      <section className="jv-upload-modal" role="dialog" aria-modal="true" aria-label="上传剧本">
        <div className="jv-modal-head">
          <div>
            <div className="jv-modal-title">上传剧本 PDF</div>
            <div style={{ marginTop: 6, color: 'var(--muted)', lineHeight: 1.6 }}>
              上传京剧剧本 PDF，自动 OCR 提取文本并 AI 分析角色、关系与主题。
            </div>
          </div>
          <button className="jv-drawer-close" onClick={onClose} aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>

        <div className="jv-dropzone"
          onClick={() => !uploading && inputRef.current?.click()}
          style={{ cursor: uploading ? 'default' : 'pointer' }}>
          <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
          {!file ? (
            <>
              <strong>点击选择 PDF 文件</strong>
              <span style={{ color: 'var(--muted)', fontSize: 13, display: 'block', marginTop: 4 }}>
                支持京剧剧本 PDF（文字版或扫描版均可）
              </span>
            </>
          ) : (
            <strong>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</strong>
          )}

          {(uploading || status === 'done' || status === 'error') && (
            <>
              <div className="jv-progress" style={{ '--progress': `${progress}%` } as React.CSSProperties}>
                <span />
              </div>
              <div className="jv-step-list">
                {steps.map((step, i) => {
                  const s = stepStatus(step.key);
                  return (
                    <div key={step.key} className={`jv-step ${s === 'done' ? 'done' : ''} ${s === 'active' ? 'active' : ''}`}>
                      <span className="jv-step-mark">{s === 'done' ? '✓' : i + 1}</span>
                      {step.label}
                      {s === 'active' && <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>处理中…</span>}
                    </div>
                  );
                })}
              </div>
              {error && <div style={{ marginTop: 10, color: 'var(--opera-red)', fontSize: 13 }}>❌ {error}</div>}
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button className="jv-button" onClick={onClose}>取消</button>
          <button className="jv-button primary"
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{ opacity: !file || uploading ? 0.55 : 1 }}>
            {uploading ? '处理中…' : '上传并分析'}
          </button>
        </div>
      </section>
    </div>
  );
}
