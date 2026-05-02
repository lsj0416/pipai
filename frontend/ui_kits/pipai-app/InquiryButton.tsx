// InquiryButton.tsx — CTA shown inline in chat to trigger inquiry generation

interface InquiryButtonProps {
  onClick?: () => void;
}

function InquiryButton({ onClick }: InquiryButtonProps): React.ReactElement {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'var(--gok-blue)', color: 'white', border: 'none',
      borderRadius: 10, padding: '10px 16px',
      fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
      cursor: 'pointer', letterSpacing: '-0.01em', alignSelf: 'flex-start',
      whiteSpace: 'nowrap',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6M9 13h6M9 17h6"/>
      </svg>
      문의글 자동 생성
    </button>
  );
}

(window as any).InquiryButton = InquiryButton;
