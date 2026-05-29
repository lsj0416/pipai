'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { listConversations, deleteConversation, type ConversationListItem } from '@/lib/api/conversations';

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
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await listConversations(token);
      if (res.success && res.data) setConversations(res.data);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (e: React.MouseEvent, conv: ConversationListItem) => {
    e.stopPropagation();
    if (!window.confirm('이 대화를 삭제하시겠어요? 복구할 수 없습니다.')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    await deleteConversation(token, conv.conversationId);
    setConversations(prev => prev.filter(c => c.conversationId !== conv.conversationId));
    window.dispatchEvent(new CustomEvent('conversationUpdate'));
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
    <div style={{ padding: '32px 32px 48px', maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em' }}>대화 목록</div>
          <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 3 }}>
            저장된 대화 내역을 확인하고 이어서 진행할 수 있어요.
          </div>
        </div>
        <button
          onClick={() => router.push('/chat')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 10, border: 'none',
            background: 'var(--gok-blue)', color: 'white',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          새 대화
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-3)', fontSize: 14 }}>불러오는 중...</div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 14, color: 'var(--fg-3)', marginBottom: 16 }}>저장된 대화가 없어요.</div>
          <button
            onClick={() => router.push('/chat')}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'var(--gok-blue)', color: 'white',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            첫 대화 시작하기
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {conversations.map(conv => (
            <ConvCard
              key={conv.conversationId}
              conv={conv}
              onClick={() => router.push(`/chat?conversationId=${conv.conversationId}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
    </div>
  );
}

function ConvCard({
  conv,
  onClick,
  onDelete,
}: {
  conv: ConversationListItem;
  onClick: () => void;
  onDelete: (e: React.MouseEvent, conv: ConversationListItem) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-tint-blue)' : 'white',
        border: `1px solid ${hovered ? 'var(--gok-blue)' : 'var(--border-subtle)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'background 120ms, border-color 120ms',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: hovered ? 'var(--gok-blue)' : 'var(--bg-canvas)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'background 120ms',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={hovered ? 'white' : 'var(--fg-3)'}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: 'var(--fg-1)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}>
          {conv.title || '대화'}
        </div>
        {conv.lastMessage && (
          <div style={{
            fontSize: 12, color: 'var(--fg-3)', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {stripMd(conv.lastMessage)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {conv.updatedAt && (
          <span style={{ fontSize: 11, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>
            {formatRelTime(conv.updatedAt)}
          </span>
        )}
        <button
          onClick={e => onDelete(e, conv)}
          title="삭제"
          style={{
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-3)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 120ms, background 120ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = 'var(--gok-red)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-3)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
