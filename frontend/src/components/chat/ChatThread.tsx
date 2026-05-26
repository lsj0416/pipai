'use client';

import type { ChatMessage, MessagePart } from '@/lib/types';
import LawCard from '@/components/shared/LawCard';
import CaseCard from '@/components/shared/CaseCard';
import InquiryButton from '@/components/inquiry/InquiryButton';

interface ChatThreadProps {
  messages: ChatMessage[];
  onPickQuick: (reply: string) => void;
  onInquiry?: () => void;
  streaming?: boolean;
}

function QuickReply({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'white', border: '1.5px solid var(--gok-blue)', color: 'var(--gok-blue)',
      borderRadius: 999, padding: '8px 18px',
      fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
      cursor: 'pointer', letterSpacing: '-0.01em',
      transition: 'all 120ms var(--ease-out)',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-tint-blue)'; }}
    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'white'; }}
    >
      {label}
    </button>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22, gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        maxWidth: '70%', background: 'var(--gok-blue)', color: 'white',
        borderRadius: 999, padding: '12px 20px', fontSize: 15, lineHeight: 1.5, letterSpacing: '-0.01em',
      }}>
        {children}
      </div>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-tint-blue)', color: 'var(--gok-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>나</div>
    </div>
  );
}

function AssistantMessage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 22 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gok-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>AI</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
        {children}
      </div>
    </div>
  );
}

const EXPERT_CHANNELS = [
  { label: '개인정보보호위원회 기술지원 컨설팅', href: 'https://www.pipc.go.kr' },
  { label: '법령해석지원센터', href: 'https://www.moleg.go.kr' },
  { label: '자가진단 서비스', href: 'https://privacy.go.kr' },
];

function MessageFooter({ showInquiry, onInquiry }: { showInquiry: boolean; onInquiry?: () => void }) {
  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 10, paddingTop: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.6, margin: '0 0 10px' }}>
        이 답변은 참고용이며, 법적 효력이 없습니다.<br />
        중요한 사항은 반드시 전문가와 상담하세요.
      </p>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)', marginBottom: 6 }}>전문가 지원 채널</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: showInquiry ? 12 : 0 }}>
        {EXPERT_CHANNELS.map(({ label, href }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>· {label}</span>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: 'var(--gok-blue)', fontWeight: 600, textDecoration: 'none' }}
            >
              바로가기
            </a>
          </div>
        ))}
      </div>
      {showInquiry && onInquiry && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <InquiryButton onClick={onInquiry} />
        </div>
      )}
    </div>
  );
}

function renderPart(p: MessagePart, j: number): React.ReactElement | null {
  if (p.type === 'text') {
    return <div key={j} style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--fg-1)', letterSpacing: '-0.01em' }} dangerouslySetInnerHTML={{ __html: p.html }} />;
  }
  if (p.type === 'law')          return <LawCard key={j} article={p.article} body={p.body} />;
  if (p.type === 'case')         return <CaseCard key={j} headline={p.headline} industry={p.industry} />;
  if (p.type === 'inquiry-cta')  return <InquiryButton key={j} onClick={p.onClick} />;
  if (p.type === 'auto-added') {
    return (
      <div key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-tint-blue)', color: 'var(--gok-blue)', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, alignSelf: 'flex-start', letterSpacing: '-0.01em' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 6 9 17l-5-5"/></svg>
        리스크 대시보드에 자동 추가됨
      </div>
    );
  }
  return null;
}

export default function ChatThread({ messages, onPickQuick, onInquiry, streaming }: ChatThreadProps) {
  const lastAssistantIdx = messages.reduce((acc, m, i) => m.role === 'assistant' ? i : acc, -1);
  const hasUserMessage = messages.some(m => m.role === 'user');

  return (
    <div style={{ padding: '24px 32px 32px', maxWidth: 820, margin: '0 auto' }}>
      {messages.map((m, i) => {
        if (m.role === 'quick') {
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              {m.replies.map(r => <QuickReply key={r} label={r} onClick={() => onPickQuick(r)} />)}
            </div>
          );
        }
        if (m.role === 'user') return <UserBubble key={i}>{m.content}</UserBubble>;

        const isLast = i === lastAssistantIdx;
        const showFooter = hasUserMessage && (!isLast || !streaming);
        const showInquiry = isLast && !streaming;

        return (
          <AssistantMessage key={i}>
            {m.parts.map((p, j) => renderPart(p, j))}
            {showFooter && (
              <MessageFooter showInquiry={showInquiry} onInquiry={onInquiry} />
            )}
          </AssistantMessage>
        );
      })}
    </div>
  );
}
