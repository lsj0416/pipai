interface TopbarProps {
  title: string;
  status?: string;
}

const btnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'white', color: 'var(--fg-2)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default function Topbar({ title, status }: TopbarProps) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 28px 16px',
      background: 'var(--bg-canvas)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em' }}>{title}</span>
        {status != null && (
          <span style={{ background: 'var(--bg-tint-blue)', color: 'var(--gok-blue)', fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {status}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={btnStyle} title="확장">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
        </button>
        <button style={btnStyle} title="더보기">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
