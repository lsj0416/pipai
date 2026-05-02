// TODO: 실제 구현 시 lib/api/profile.ts getProfile()로 데이터 fetch

export default function MyPage() {
  return (
    <div style={{ padding: '40px 32px', maxWidth: 720, overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em' }}>마이페이지</div>
      <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, marginBottom: 22 }}>
        기업 프로필을 정확히 등록하면 진단 정확도가 높아져요.
      </div>
      <div style={{
        background: 'white', border: '1px solid var(--border-subtle)', borderRadius: 14,
        padding: '20px 22px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', fontSize: 14,
      }}>
        <div style={{ color: 'var(--fg-3)' }}>상호명</div>   <div style={{ color: 'var(--fg-1)', fontWeight: 600 }}>—</div>
        <div style={{ color: 'var(--fg-3)' }}>업종</div>     <div style={{ color: 'var(--fg-1)' }}>—</div>
        <div style={{ color: 'var(--fg-3)' }}>직원 수</div>  <div style={{ color: 'var(--fg-1)' }}>—</div>
        <div style={{ color: 'var(--fg-3)' }}>연 매출</div>  <div style={{ color: 'var(--fg-1)' }}>—</div>
        <div style={{ color: 'var(--fg-3)' }}>회원 보유</div><div style={{ color: 'var(--fg-1)' }}>—</div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{
          background: 'var(--gok-blue)', color: 'white', border: 'none',
          padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>프로필 편집</button>
      </div>
    </div>
  );
}
