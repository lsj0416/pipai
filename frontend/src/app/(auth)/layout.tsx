import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-canvas)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Image src="/logo-mono-blue.svg" width={163} height={48} style={{ margin: '0 auto' }} alt="PIPAi" unoptimized />
        </div>
        {children}
      </div>
    </div>
  );
}
