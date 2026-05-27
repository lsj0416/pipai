'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InquiryGen from '@/components/inquiry/InquiryGen';
import type { InquiryDraft } from '@/lib/types';
import { generateInquiry } from '@/lib/api/inquiry';
import { getProfile } from '@/lib/api/profile';

function InquiryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');

  const [draft, setDraft] = useState<InquiryDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!conversationId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
     
    setError('');

    Promise.all([
      generateInquiry(token, conversationId),
      getProfile(token),
    ])
      .then(([inquiryRes, profileRes]) => {
        if (!inquiryRes.success || !inquiryRes.data) {
          setError(inquiryRes.error?.message ?? '문의글 생성에 실패했어요.');
          return;
        }
        const d = inquiryRes.data;
        const p = profileRes.success ? profileRes.data : null;
        const empLabel = p?.employeeCount ? `${p.employeeCount}명` : '';
        setDraft({
          recipient: '개인정보보호위원회 기술지원 컨설팅',
          title: d.subject,
          biz: {
            industry: p?.businessType ?? '',
            size: empLabel,
            collected: p?.personalDataItems ?? '',
            method: p?.collectionMethods ?? '',
          },
          body: d.content,
          diagnosis: {
            status: '검토 필요',
            law: d.relatedLaws ?? '',
            precedent: d.precedent ?? '',
          },
        });
      })
      .catch(() => setError('서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'))
      .finally(() => setLoading(false));
  }, [conversationId, router]);

  // conversationId 없이 직접 접근한 경우
  if (!conversationId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ maxWidth: 400, textAlign: 'center', padding: '0 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 8 }}>
            대화가 필요해요
          </div>
          <div style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.6, marginBottom: 24 }}>
            AI 대화에서 리스크를 진단한 뒤<br />문의글을 자동 생성할 수 있어요.
          </div>
          <button onClick={() => router.push('/chat')} style={{
            background: 'var(--gok-blue)', color: 'white', border: 'none',
            padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            대화 시작하기 →
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--fg-3)', marginBottom: 8 }}>문의글을 생성하고 있어요...</div>
          <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>대화 내용을 분석 중이에요</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 32px', maxWidth: 480 }}>
        <div style={{ background: '#FEF2F2', color: 'var(--gok-red)', padding: '16px 20px', borderRadius: 12, fontSize: 14, lineHeight: 1.6 }}>
          {error}
        </div>
        <button onClick={() => router.push('/chat')} style={{
          marginTop: 16, background: 'none', border: 'none', color: 'var(--gok-blue)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)',
        }}>← 대화로 돌아가기</button>
      </div>
    );
  }

  if (!draft) return null;

  return <InquiryGen draft={draft} onBack={() => router.push('/chat')} />;
}

export default function InquiryPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--fg-3)', fontSize: 14 }}>
        로딩 중...
      </div>
    }>
      <InquiryContent />
    </Suspense>
  );
}
