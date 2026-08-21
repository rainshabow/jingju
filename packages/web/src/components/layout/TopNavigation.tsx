import { IconLine } from '../shared/IconLine';
import { useThemeStore } from '../../stores/themeStore';

interface Props {
  onOpenUpload: () => void;
  onOpenAbout: () => void;
}

export function TopNavigation({ onOpenUpload, onOpenAbout }: Props) {
  const { theme, toggle } = useThemeStore();

  return (
    <header className="jv-topbar">
      <div className="jv-brand">
        <div className="jv-mask-mark" />
        <div>
          <h1 className="jv-brand-title">戏韵万象</h1>
          <div className="jv-brand-subtitle">京剧数据可视分析系统</div>
        </div>
      </div>
      <div className="jv-actions">
        <button
          className="jv-button dark"
          onClick={toggle}
          aria-label={theme === 'light' ? '切换到暗色模式' : '切换到浅色模式'}
          title={theme === 'light' ? '暗色 · 戏台深' : '浅色 · 宣纸白'}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {theme === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          )}
          {theme === 'light' ? '暗色' : '浅色'}
        </button>
        <button className="jv-button dark" onClick={onOpenUpload}>
          <IconLine name="upload" size={16} /> 上传剧本
        </button>
        <button className="jv-button dark" onClick={onOpenAbout}>
          <IconLine name="info" size={16} /> 关于
        </button>
      </div>
    </header>
  );
}
