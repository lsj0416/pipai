import type { LawPart } from '@/lib/types';

type LawCardProps = Omit<LawPart, 'type'>;

export default function LawCard({ article, body }: LawCardProps) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 6,
      padding: '12px 16px',
      maxWidth: 520,
      boxShadow: '0 1px 2px rgba(0,55,100,0.04)',
      border: '1px solid var(--border-subtle)',
      borderLeft: '4px solid var(--gok-blue)',
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
