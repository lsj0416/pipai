'use client';

import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import type { NavId, RiskMiniItem, UserData, UserBusiness } from '@/lib/types';

interface SidebarProps {
  riskItems: RiskMiniItem[];
  user: UserData;
}

const NAV_ITEMS: { id: NavId; label: string; path: string }[] = [
  { id: 'chat',    label: '대화',            path: '/chat' },
  { id: 'dash',    label: '리스크 대시보드', path: '/dashboard' },
  { id: 'me',      label: '마이페이지',       path: '/mypage' },
  { id: 'inquiry', label: '문의글 생성',     path: '/inquiry' },
];

const SEV_PILL: Record<string, { bg: string; label: string }> = {
  high:   { bg: '#E4032E', label: '위험' },
  medium: { bg: '#E89B0F', label: '확인필요' },
  safe:   { bg: '#3F6E9A', label: '양호' },
};

function NavIcon({ id }: { id: NavId }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, style: { flexShrink: 0 } };
  if (id === 'chat')    return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  if (id === 'dash')    return <svg {...common}><path d="M3 3v18h18"/><path d="M7 16l4-6 4 3 5-8"/></svg>;
  if (id === 'me')      return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>;
  if (id === 'inquiry') return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>;
  return null;
}

function UserChip({ name, business }: { name: string; business: UserBusiness }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'white', marginTop: 'auto' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
        {name[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{business.name}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{business.meta}</div>
      </div>
    </div>
  );
}

export default function Sidebar({ riskItems, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside style={{
      width: 260, flexShrink: 0,
      background: 'var(--bg-sidebar)', color: 'white',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* 로고 */}
      <div style={{ padding: '22px 22px 6px' }}>
        <Logo variant="white" width={129} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8, letterSpacing: '-0.01em' }}>개인정보보호 AI 컨설팅</div>
      </div>

      {/* 새 대화 버튼 */}
      <button onClick={() => router.push('/chat')} style={{
        margin: '18px 16px 8px', padding: '10px 14px', width: 'calc(100% - 32px)',
        borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
        background: 'transparent', color: 'white',
        fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        letterSpacing: '-0.01em', whiteSpace: 'nowrap',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M12 5v14M5 12h14"/></svg>
        새 대화 시작
      </button>

      {/* 메뉴 섹션 */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', padding: '14px 22px 4px' }}>메뉴</div>
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.path);
        return (
          <button key={item.id} onClick={() => router.push(item.path)} style={{
            width: 'calc(100% - 16px)', margin: '0 8px', textAlign: 'left',
            padding: '10px 14px', borderRadius: 10, border: 'none',
            background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
            color: 'white', fontSize: 14, fontFamily: 'var(--font-body)',
            fontWeight: active ? 600 : 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            letterSpacing: '-0.01em', whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (!active) e.currentTarget.style.background = active ? 'rgba(255,255,255,0.12)' : 'transparent'; }}
          >
            <span style={{ display: 'inline-flex', opacity: 0.95, flexShrink: 0 }}><NavIcon id={item.id} /></span>
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* 리스크 현황 */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', padding: '14px 22px 4px' }}>리스크 현황</div>
      <div style={{ margin: '4px 16px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 10, letterSpacing: '-0.01em' }}>기업 프로필 기반 진단</div>
        {riskItems.length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>진단 항목 없음</div>
        )}
        {riskItems.map((it, i) => {
          const p = SEV_PILL[it.severity] ?? { bg: 'var(--gray-400)', label: '미확인' };
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'white', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
              <span style={{ background: p.bg, color: 'white', fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 10px', letterSpacing: '-0.01em', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.label}</span>
            </div>
          );
        })}
      </div>

      <UserChip name={user.name} business={user.business} />
    </aside>
  );
}
