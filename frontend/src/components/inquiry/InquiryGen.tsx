'use client';

import { useState } from 'react';
import type { InquiryDraft } from '@/lib/types';
import { updateInquiry } from '@/lib/api/inquiry';

interface InquiryGenProps {
  draft: InquiryDraft;
  onBack: () => void;
}

function Section({ title, children, last = false }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ paddingTop: 16, paddingBottom: last ? 0 : 16, borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.01em', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, fontSize: 14, lineHeight: 1.55 }}>
      <div style={{ color: 'var(--fg-3)' }}>· {k}</div>
      <div style={{ color: 'var(--fg-1)' }}>{v}</div>
    </div>
  );
}

export default function InquiryGen({ draft, onBack }: InquiryGenProps) {
  const [title, setTitle] = useState(draft.title);
  const [body, setBody] = useState(draft.body);
  const [saveLabel, setSaveLabel] = useState('임시저장');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const token = localStorage.getItem('accessToken');
    if (!token || !draft.id) return;
    setSaving(true);
    try {
      await updateInquiry(token, draft.id, title, body);
      setSaveLabel('저장됨 ✓');
      setTimeout(() => setSaveLabel('임시저장'), 2000);
    } catch {
      setSaveLabel('저장 실패');
      setTimeout(() => setSaveLabel('임시저장'), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
    <div style={{ padding: '24px 32px 48px', maxWidth: 860, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', color: 'var(--fg-2)',
        fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500,
        cursor: 'pointer', padding: '6px 0', marginBottom: 8,
        display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      }}>← 대화로 돌아가기</button>

      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em' }}>전문가 문의글</div>
      <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, marginBottom: 22 }}>대화 내용을 바탕으로 자동 정리해 드렸어요. 내용을 확인하고 임시저장하세요.</div>

      <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '22px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px 16px', fontSize: 14, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--fg-3)' }}>수신</div>
          <div style={{ color: 'var(--fg-1)' }}>{draft.recipient}</div>
          <div style={{ color: 'var(--fg-3)' }}>제목</div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              border: 'none', outline: 'none', fontFamily: 'var(--font-body)',
              fontSize: 15, fontWeight: 600, color: 'var(--fg-1)',
              letterSpacing: '-0.01em', padding: 0, background: 'transparent', width: '100%',
            }}
          />
        </div>

        <Section title="■ 사업자 정보">
          <KV k="업종"          v={draft.biz.industry} />
          <KV k="규모"          v={draft.biz.size} />
          <KV k="수집 개인정보" v={draft.biz.collected} />
          <KV k="수집 방법"     v={draft.biz.method} />
        </Section>

        <Section title="■ 현황 및 문의 사항">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            style={{
              width: '100%', minHeight: 100, resize: 'vertical',
              fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7,
              color: 'var(--fg-1)', padding: '10px 12px',
              border: '1px solid var(--border-subtle)', borderRadius: 8,
              outline: 'none', letterSpacing: '-0.01em', background: 'var(--bg-subtle)',
            }}
          />
        </Section>

        <Section title="■ AI 진단 결과">
          <KV k="수집 동의 절차" v={<span style={{ color: 'var(--gok-red)', fontWeight: 600 }}>{draft.diagnosis.status}</span>} />
          <KV k="관련 조항"      v={<span style={{ color: 'var(--gok-blue)', fontWeight: 600 }}>{draft.diagnosis.law}</span>} />
          <KV k="유사 처분 사례" v={draft.diagnosis.precedent || <span style={{ color: 'var(--fg-4)' }}>유사 사례 없음</span>} />
        </Section>

        {/* 제출 및 문의 방법 */}
        <Section title="■ 제출 및 문의 방법" last>
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, color: 'var(--fg-1)' }}>☎ 02-2100-3043</div>
              <div style={{ fontSize: 13, color: 'var(--fg-2)', paddingLeft: 20 }}>
                (개인정보보호위원회 법령해석지원센터)<br />
                월~금 9:00~18:00, 공휴일 제외
              </div>
              <a
                href="https://www.epeople.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--gok-blue)', textDecoration: 'underline', cursor: 'pointer' }}
              >
                🏛 국민신문고(epeople.go.kr) 제출
              </a>
            </div>
          </div>
        </Section>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'white', border: '1px solid var(--border-default)', color: 'var(--fg-1)',
              padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: saving ? 'default' : 'pointer', fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap', opacity: saving ? 0.6 : 1,
            }}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
