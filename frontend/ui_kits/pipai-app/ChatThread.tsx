// ChatThread.tsx — bubbles + AI responses + quick-replies, matching v2 reference

interface QuickReplyProps {
  label: string;
  onClick: () => void;
}

interface QuickReplyRowProps {
  replies: string[];
  onPick: (reply: string) => void;
}

interface UserBubbleProps {
  children: React.ReactNode;
}

interface AssistantMessageProps {
  children: React.ReactNode;
}

interface AITextProps {
  html: string;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  onPickQuick: (reply: string) => void;
}

function QuickReply({ label, onClick }: QuickReplyProps): React.ReactElement {
  return (
    <button onClick={onClick} style={{
      background: 'white',
      border: '1.5px solid var(--gok-blue)',
      color: 'var(--gok-blue)',
      borderRadius: 999,
      padding: '8px 18px',
      fontSize: 14, fontWeight: 600,
      fontFamily: 'var(--font-body)',
      cursor: 'pointer', letterSpacing: '-0.01em',
      transition: 'all 120ms var(--ease-out)',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-tint-blue)'; }}
    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'white'; }}
    >
      {label}
    </button>
  );
}

function QuickReplyRow({ replies, onPick }: QuickReplyRowProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
      {replies.map(r => <QuickReply key={r} label={r} onClick={() => onPick(r)} />)}
    </div>
  );
}

function UserBubble({ children }: UserBubbleProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22, gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        maxWidth: '70%',
        background: 'var(--gok-blue)',
        color: 'white',
        borderRadius: 999,
        padding: '12px 20px',
        fontSize: 15, lineHeight: 1.5,
        letterSpacing: '-0.01em',
      }}>
        {children}
      </div>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-tint-blue)', color: 'var(--gok-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>나</div>
    </div>
  );
}

function AssistantMessage({ children }: AssistantMessageProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 22 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gok-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2, letterSpacing: 0 }}>AI</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
        {children}
      </div>
    </div>
  );
}

function AIText({ html }: AITextProps): React.ReactElement {
  return (
    <div
      style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderPart(p: MessagePart, j: number): React.ReactElement | null {
  if (p.type === 'text') return <AIText key={j} html={p.html} />;
  if (p.type === 'law')  return <LawCard key={j} article={p.article} body={p.body} />;
  if (p.type === 'case') return <CaseCard key={j} headline={p.headline} industry={p.industry} />;
  if (p.type === 'inquiry-cta') return <InquiryButton key={j} onClick={p.onClick} />;
  if (p.type === 'auto-added') {
    return (
      <div key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-tint-blue)', color: 'var(--gok-blue)', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, alignSelf: 'flex-start', letterSpacing: '-0.01em' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M20 6 9 17l-5-5"/>
        </svg>
        리스크 대시보드에 자동 추가됨
      </div>
    );
  }
  return null;
}

function ChatThread({ messages, onPickQuick }: ChatThreadProps): React.ReactElement {
  return (
    <div style={{ padding: '24px 32px 160px', maxWidth: 820, margin: '0 auto' }}>
      {messages.map((m: ChatMessage, i: number) => {
        if (m.role === 'quick') return <QuickReplyRow key={i} replies={m.replies} onPick={onPickQuick} />;
        if (m.role === 'user')  return <UserBubble key={i}>{m.content}</UserBubble>;
        return (
          <AssistantMessage key={i}>
            {m.parts.map((p: MessagePart, j: number) => renderPart(p, j))}
          </AssistantMessage>
        );
      })}
    </div>
  );
}

(window as any).ChatThread = ChatThread;
