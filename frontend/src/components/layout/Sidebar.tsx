'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import type { NavId, RiskMiniItem, SeverityActive, UserData, UserBusiness } from '@/lib/types';
import { logout } from '@/lib/api/auth';
import { listConversations, deleteConversation, type ConversationListItem } from '@/lib/api/conversations';
import { getRisks } from '@/lib/api/dashboard';

interface SidebarProps {
  riskItems: RiskMiniItem[];
  user: UserData;
}

const stripMd = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\n/g, ' ');

function formatRelTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
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

function UserChip({ name, business, onLogout }: { name: string; business: UserBusiness; onLogout: () => void }) {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', color: 'white' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
          {name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{business.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{business.meta}</div>
        </div>
        <button
          onClick={onLogout}
          title="로그아웃"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)', padding: 4, display: 'flex', alignItems: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ riskItems, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [localRiskItems, setLocalRiskItems] = useState<RiskMiniItem[]>(riskItems);
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);

  useEffect(() => {
    const handleRiskUpdate = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const levelMap: Record<string, SeverityActive> = {
        IMMEDIATE: 'high',
        CHECK_NEEDED: 'medium',
        GOOD: 'safe',
      };
      getRisks(token)
        .then(res => {
          if (res.success && res.data) {
            setLocalRiskItems(
              res.data
                .filter(r => !r.resolved)
                .slice(0, 5)
                .map(r => ({ label: r.title, severity: levelMap[r.level] ?? 'medium' })),
            );
          }
        })
        .catch(() => {});
    };
    window.addEventListener('riskUpdate', handleRiskUpdate);
    return () => window.removeEventListener('riskUpdate', handleRiskUpdate);
  }, []);

  const loadConversations = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    listConversations(token)
      .then(res => {
        if (res.success && res.data) {
          setConversations(res.data.slice(0, 8));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadConversations();
   
  }, [pathname]);

  useEffect(() => {
    window.addEventListener('conversationUpdate', loadConversations);
    return () => window.removeEventListener('conversationUpdate', loadConversations);
   
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  return (
    <aside style={{
      width: 260, flexShrink: 0,
      background: 'var(--bg-sidebar)', color: 'white',
      display: 'flex', flexDirection: 'column', height: '100%',
      overflowY: 'auto',
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

      {/* 최근 대화 목록 */}
      {conversations.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', padding: '14px 22px 4px' }}>최근 대화</div>
          {conversations.map(conv => {
            const isActive = pathname === '/chat' && typeof window !== 'undefined'
              && new URLSearchParams(window.location.search).get('conversationId') === conv.conversationId;
            const isHovered = hoveredConvId === conv.conversationId;
            return (
              <div
                key={conv.conversationId}
                style={{ position: 'relative', margin: '0 8px' }}
                onMouseEnter={() => setHoveredConvId(conv.conversationId)}
                onMouseLeave={() => setHoveredConvId(null)}
              >
                <button
                  onClick={() => router.push(`/chat?conversationId=${conv.conversationId}`)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '8px 36px 8px 14px', borderRadius: 8, border: 'none',
                    background: isActive ? 'rgba(255,255,255,0.12)' : isHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: 'white', fontSize: 12, fontFamily: 'var(--font-body)',
                    fontWeight: 400, cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85, flex: 1, minWidth: 0 }}>
                      {conv.title || '대화'}
                    </div>
                    {conv.updatedAt && !isHovered && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatRelTime(conv.updatedAt)}
                      </div>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {stripMd(conv.lastMessage)}
                    </div>
                  )}
                </button>

                {isHovered && (
                  <button
                    title="대화 삭제"
                    onClick={async e => {
                      e.stopPropagation();
                      if (!window.confirm('이 대화를 삭제하시겠어요?')) return;
                      const token = localStorage.getItem('accessToken');
                      if (!token) return;
                      await deleteConversation(token, conv.conversationId);
                      setConversations(prev => prev.filter(c => c.conversationId !== conv.conversationId));
                      window.dispatchEvent(new CustomEvent('conversationUpdate'));
                    }}
                    style={{
                      position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                      width: 24, height: 24, borderRadius: 6, border: 'none',
                      background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(228,3,46,0.25)'; e.currentTarget.style.color = '#fca5a5'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}

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
        {localRiskItems.length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>진단 항목 없음</div>
        )}
        {localRiskItems.map((it, i) => {
          const p = SEV_PILL[it.severity] ?? { bg: 'var(--gray-400)', label: '미확인' };
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'white', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
              <span style={{ background: p.bg, color: 'white', fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 10px', letterSpacing: '-0.01em', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.label}</span>
            </div>
          );
        })}
      </div>

      <UserChip name={user.name} business={user.business} onLogout={handleLogout} />
    </aside>
  );
}
