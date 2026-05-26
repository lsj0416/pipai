'use client';

import { useState, useRef, useEffect } from 'react';

export interface TopbarMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface TopbarProps {
  title: string;
  status?: string;
  menuItems?: TopbarMenuItem[];
}

const btnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'white', color: 'var(--fg-2)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default function Topbar({ title, status, menuItems }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

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

        {/* ··· 메뉴 */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            style={btnStyle}
            title="더보기"
            onClick={() => setOpen(o => !o)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
          </button>

          {open && menuItems && menuItems.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: 'white', border: '1px solid var(--border-default)',
              borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              minWidth: 180, zIndex: 100, overflow: 'hidden',
            }}>
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => { item.onClick(); setOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '11px 16px', border: 'none', background: 'transparent',
                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    color: item.danger ? 'var(--gok-red)' : 'var(--fg-1)',
                    borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = item.danger ? '#FEF2F2' : 'var(--bg-canvas)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
