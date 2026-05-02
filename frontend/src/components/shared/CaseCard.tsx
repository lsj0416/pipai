import type { CasePart } from '@/lib/types';

type CaseCardProps = Omit<CasePart, 'type'>;

export default function CaseCard({ headline }: CaseCardProps) {
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
