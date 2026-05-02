export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-canvas)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo-mono-blue.svg" style={{ height: 48, margin: '0 auto' }} alt="PIPAi" />
        </div>
        {children}
      </div>
    </div>
  );
}
