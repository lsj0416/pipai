'use client';

import { useRouter } from 'next/navigation';

interface SavedField {
  label: string;
  displayValue: string;
}

interface ProfileFillPanelProps {
  percent: number;
  recentFields: SavedField[];
}

export default function ProfileFillPanel({ percent, recentFields }: ProfileFillPanelProps) {
  const router = useRouter();

  return (
    <div style={{
      margin: '0 16px 8px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--color-gok-blue)',
      borderRadius: 12,
      padding: '12px 16px',
      fontSize: 13,
    }}>
      {/* 진행률 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            background: 'var(--color-gok-blue)',
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <span style={{ color: 'var(--color-gok-blue)', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
          {percent}% 완료
        </span>
      </div>

      {/* 저장된 항목 */}
      {recentFields.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>저장됨:</span>
          {recentFields.map((f, i) => (
            <span key={i} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{f.label}</strong>
              {' '}
              <span style={{ color: 'var(--color-gok-blue)' }}>{f.displayValue}</span>
              {i < recentFields.length - 1 && <span style={{ color: 'var(--border)' }}> · </span>}
            </span>
          ))}
        </div>
      )}

      {/* 마이페이지 링크 */}
      <button
        onClick={() => router.push('/mypage')}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--color-gok-blue)',
          fontSize: 12,
          cursor: 'pointer',
          textDecoration: 'underline',
          fontWeight: 500,
        }}
      >
        마이페이지에서 전체 내용 확인 →
      </button>
    </div>
  );
}
