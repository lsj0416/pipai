'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '@/lib/api/auth';

const TERMS = [
  { key: 'termsService',   label: '서비스 이용약관',             required: true },
  { key: 'termsPrivacy',   label: '개인정보 수집·이용 동의',      required: true },
  { key: 'termsMarketing', label: '마케팅 정보 수신 동의',        required: false },
  { key: 'termsAiUsage',   label: '대화 내용 서비스 개선 활용 동의', required: false },
] as const;

type TermsKey = typeof TERMS[number]['key'];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    contactPhone: '',
  });
  const [terms, setTerms] = useState<Record<TermsKey, boolean>>({
    termsService: false,
    termsPrivacy: false,
    termsMarketing: false,
    termsAiUsage: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    border: '1px solid var(--border-default)', borderRadius: 10,
    fontFamily: 'var(--font-body)', outline: 'none',
    background: 'white', color: 'var(--fg-1)', boxSizing: 'border-box',
  };

  const allRequired = terms.termsService && terms.termsPrivacy;

  const toggleAll = (checked: boolean) => {
    setTerms({ termsService: checked, termsPrivacy: checked, termsMarketing: checked, termsAiUsage: checked });
  };

  const allChecked = Object.values(terms).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRequired) {
      setError('필수 약관에 동의해야 합니다.');
      return;
    }
    if (!form.contactPhone.trim()) {
      setError('담당자 연락처를 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await signup({
        email: form.email,
        password: form.password,
        name: form.name,
        title: form.title || undefined,
        contactPhone: form.contactPhone,
        ...terms,
      });
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

      {error && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* 기본 계정 정보 */}
      <input type="text" placeholder="이름" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        required style={inputStyle} />
      <input type="email" placeholder="이메일" value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        required style={inputStyle} />
      <input type="password" placeholder="비밀번호 (8자 이상)" value={form.password}
        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
        required minLength={8} style={inputStyle} />

      {/* 담당자 정보 */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', marginBottom: 8, letterSpacing: '0.02em' }}>담당자 정보</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="text" placeholder="직함 (선택, 예: 대표, 경영지원팀장)" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={inputStyle} />
          <input type="tel" placeholder="연락처 (필수, 예: 010-0000-0000)" value={form.contactPhone}
            onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
            required style={inputStyle} />
        </div>
      </div>

      {/* 약관 동의 */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', marginBottom: 10, letterSpacing: '0.02em' }}>약관 동의</div>

        {/* 전체 동의 */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10,
          background: 'var(--bg-canvas)', cursor: 'pointer',
          marginBottom: 8,
        }}>
          <input type="checkbox" checked={allChecked}
            onChange={e => toggleAll(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>전체 동의</span>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
          {TERMS.map(({ key, label, required }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
              <input type="checkbox" checked={terms[key]}
                onChange={e => setTerms(t => ({ ...t, [key]: e.target.checked }))}
                style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>
                {label}
                <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 6, color: required ? 'var(--gok-red)' : 'var(--fg-3)' }}>
                  {required ? '(필수)' : '(선택)'}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading || !allRequired} style={{
        background: allRequired ? 'var(--gok-blue)' : 'var(--border-default)',
        color: allRequired ? 'white' : 'var(--fg-3)',
        border: 'none', padding: '12px', borderRadius: 10,
        fontSize: 15, fontWeight: 600,
        cursor: loading || !allRequired ? 'default' : 'pointer',
        fontFamily: 'var(--font-body)', marginTop: 4,
        opacity: loading ? 0.7 : 1,
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
