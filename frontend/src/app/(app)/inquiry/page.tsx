'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InquiryGen from '@/components/inquiry/InquiryGen';
import type { InquiryDraft } from '@/lib/types';
import { generateInquiry, getInquiry, listInquiries, type BackendInquiryDraft } from '@/lib/api/inquiry';
import { getProfile, type Profile } from '@/lib/api/profile';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function buildDraft(d: BackendInquiryDraft, p: Profile | null): InquiryDraft {
  const empLabel = p?.overview.employeeCount ? `${p.overview.employeeCount}명` : '';
  return {
    id: d.id,
    recipient: '개인정보보호위원회 기술지원 컨설팅',
    title: d.subject,
    biz: {
      industry: p?.overview.businessType ?? '',
      size: empLabel,
      collected: p?.overview.personalDataItems ?? '',
      method: p?.overview.collectionMethods ?? '',
    },
    body: d.content,
    diagnosis: {
      status: '검토 필요',
      law: d.relatedLaws ?? '',
      precedent: d.precedent ?? '',
    },
    updatedAt: d.updatedAt,
  };
}

// ── 목록 화면 ─────────────────────────────────────────────────────────────────
function InquiryList() {
  const router = useRouter();
  const [items, setItems] = useState<BackendInquiryDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    listInquiries(token)
      .then(res => { if (res.success && res.data) setItems(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: 14, color: 'var(--fg-3)' }}>불러오는 중...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ maxWidth: 400, textAlign: 'center', padding: '0 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 8 }}>
            아직 생성된 문의글이 없어요
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

  return (
    <div style={{ padding: '24px 32px', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em', marginBottom: 6 }}>저장된 문의글</div>
      <div style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 24 }}>생성한 문의글을 확인하고 수정할 수 있어요.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => router.push(`/inquiry?id=${item.id}`)}
            style={{
              background: 'white', border: '1px solid var(--border-subtle)', borderRadius: 12,
              padding: '16px 20px', textAlign: 'left', cursor: 'pointer',
              fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gok-blue)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--gok-blue)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                {item.subject}
              </div>
              {item.updatedAt && (
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>
                  {formatDate(item.updatedAt)} 수정
                </div>
              )}
            </div>
            <span style={{
              background: item.status === 'SUBMITTED' ? '#DCFCE7' : '#F3F4F6',
              color: item.status === 'SUBMITTED' ? '#16A34A' : 'var(--fg-3)',
              fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '3px 10px',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {item.status === 'SUBMITTED' ? '제출됨' : '임시저장'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 메인 컨텐츠 ───────────────────────────────────────────────────────────────
function InquiryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');
  const inquiryId = searchParams.get('id');

  const [draft, setDraft] = useState<InquiryDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ?id=... → 저장된 문의글 불러오기
  useEffect(() => {
    if (!inquiryId) return;
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([getInquiry(token, inquiryId), getProfile(token)])
      .then(([inquiryRes, profileRes]) => {
        if (!inquiryRes.success || !inquiryRes.data) {
          setError(inquiryRes.error?.message ?? '문의글을 불러올 수 없어요.');
          return;
        }
        const p = profileRes.success ? profileRes.data : null;
        setDraft(buildDraft(inquiryRes.data, p));
      })
      .catch(() => setError('서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'))
      .finally(() => setLoading(false));
  }, [inquiryId, router]);

  // ?conversationId=... → 문의글 생성
  useEffect(() => {
    if (!conversationId) return;
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    Promise.all([generateInquiry(token, conversationId), getProfile(token)])
      .then(([inquiryRes, profileRes]) => {
        if (!inquiryRes.success || !inquiryRes.data) {
          setError(inquiryRes.error?.message ?? '문의글 생성에 실패했어요.');
          return;
        }
        const p = profileRes.success ? profileRes.data : null;
        setDraft(buildDraft(inquiryRes.data, p));
        window.dispatchEvent(new CustomEvent('inquiryUpdate'));
      })
      .catch(() => setError('서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'))
      .finally(() => setLoading(false));
  }, [conversationId, router]);

  // 파라미터 없음 → 목록 화면
  if (!conversationId && !inquiryId) return <InquiryList />;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--fg-3)', marginBottom: 8 }}>
            {conversationId ? '문의글을 생성하고 있어요...' : '불러오는 중...'}
          </div>
          {conversationId && <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>대화 내용을 분석 중이에요</div>}
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

  return <InquiryGen draft={draft} onBack={() => router.push(conversationId ? `/chat?conversationId=${conversationId}` : '/inquiry')} />;
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
