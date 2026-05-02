'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '@/lib/api/auth';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    border: '1px solid var(--border-default)', borderRadius: 10,
    fontFamily: 'var(--font-body)', outline: 'none',
    background: 'white', color: 'var(--fg-1)',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signup({ email, password, name });
      if (res.success) {
        router.push('/login');
      } else {
        setError(res.error?.message ?? '회원가입에 실패했어요.');
      }
    } catch {
      setError('서버에 연결할 수 없어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em', textAlign: 'center', marginBottom: 8 }}>회원가입</div>
      {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>{error}</div>}
      <input type="text" placeholder="이름" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
      <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
      <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
      <button type="submit" disabled={loading} style={{
        background: 'var(--gok-blue)', color: 'white', border: 'none',
        padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 600,
        cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--font-body)',
        opacity: loading ? 0.7 : 1, marginTop: 4,
      }}>
        {loading ? '가입 중...' : '회원가입'}
      </button>
      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--fg-3)', marginTop: 8 }}>
        이미 계정이 있으신가요?{' '}
        <a href="/login" style={{ color: 'var(--gok-blue)', fontWeight: 600, textDecoration: 'none' }}>로그인</a>
      </div>
    </form>
  );
}
