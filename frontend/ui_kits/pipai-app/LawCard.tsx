// LawCard.tsx — blue left-border treatment matching reference

interface LawCardProps {
  article: string;
  body: string;
}

function LawCard({ article, body }: LawCardProps): React.ReactElement {
  return (
    <div style={{
      background: 'white',
      borderLeft: '4px solid var(--gok-blue)',
      borderRadius: '6px',
      padding: '12px 16px',
      maxWidth: 520,
      boxShadow: '0 1px 2px rgba(0,55,100,0.04)',
      border: '1px solid var(--border-subtle)',
      borderLeftWidth: 4,
      borderLeftColor: 'var(--gok-blue)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gok-blue)', letterSpacing: '-0.01em' }}>
        관련 법령 · {article}
      </div>
      <div style={{ fontSize: 14, color: 'var(--fg-1)', lineHeight: 1.65, marginTop: 6 }}>
        {body}
      </div>
    </div>
  );
}

(window as any).LawCard = LawCard;
