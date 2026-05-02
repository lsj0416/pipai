// CaseCard.tsx — pink-tinted similar precedent box

interface CaseCardProps {
  industry?: string;
  headline: string;
}

function CaseCard({ headline }: CaseCardProps): React.ReactElement {
  return (
    <div style={{
      background: 'var(--bg-case)',
      borderRadius: 10,
      padding: '12px 16px',
      maxWidth: 520,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red-600)', letterSpacing: '-0.01em' }}>
        유사 처분 사례
      </div>
      <div style={{ fontSize: 14, color: 'var(--red-600)', lineHeight: 1.6, marginTop: 6 }}>
        {headline}
      </div>
    </div>
  );
}

(window as any).CaseCard = CaseCard;
