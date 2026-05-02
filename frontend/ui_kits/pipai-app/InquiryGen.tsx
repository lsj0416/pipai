// InquiryGen.tsx — 전문가 문의글 자동 생성 화면 (template-formatted)

interface InquiryGenProps {
  draft: InquiryDraft;
  onBack: () => void;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}

interface KVProps {
  k: string;
  v: React.ReactNode;
}

function Section({ title, children, last = false }: SectionProps): React.ReactElement {
  return (
    <div style={{ paddingTop: 16, paddingBottom: last ? 0 : 16, borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.01em', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function KV({ k, v }: KVProps): React.ReactElement {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, fontSize: 14, lineHeight: 1.55 }}>
      <div style={{ color: 'var(--fg-3)' }}>· {k}</div>
      <div style={{ color: 'var(--fg-1)' }}>{v}</div>
    </div>
  );
}

function InquiryGen({ draft, onBack }: InquiryGenProps): React.ReactElement {
  return (
    <div style={{ padding: '24px 32px 48px', overflowY: 'auto', height: '100%', maxWidth: 820, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', color: 'var(--fg-2)',
        fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500,
        cursor: 'pointer', padding: '6px 0', marginBottom: 8,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap',
      }}>← 대화로 돌아가기</button>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em' }}>전문가 문의글</div>
      <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, marginBottom: 22 }}>대화 내용을 바탕으로 자동 정리해 드렸어요. 보내기 전 확인해 주세요.</div>

      <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '22px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px 16px', fontSize: 14, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--fg-3)' }}>수신</div>
          <div style={{ color: 'var(--fg-1)' }}>{draft.recipient}</div>
          <div style={{ color: 'var(--fg-3)' }}>제목</div>
          <input defaultValue={draft.title} style={{
            border: 'none', outline: 'none', fontFamily: 'var(--font-body)',
            fontSize: 15, fontWeight: 600, color: 'var(--fg-1)',
            letterSpacing: '-0.01em', padding: 0, background: 'transparent', width: '100%',
          }} />
        </div>

        <Section title="■ 사업자 정보">
          <KV k="업종"           v={draft.biz.industry} />
          <KV k="규모"           v={draft.biz.size} />
          <KV k="수집 개인정보"  v={draft.biz.collected} />
          <KV k="수집 방법"      v={draft.biz.method} />
        </Section>

        <Section title="■ 현황 및 문의 사항">
          <textarea defaultValue={draft.body} style={{
            width: '100%', minHeight: 100, resize: 'vertical',
            fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7,
            color: 'var(--fg-1)', padding: '10px 12px',
            border: '1px solid var(--border-subtle)', borderRadius: 8,
            outline: 'none', letterSpacing: '-0.01em', background: 'var(--bg-subtle)',
          }} />
        </Section>

        <Section title="■ AI 진단 결과" last>
          <KV k="수집 동의 절차" v={<span style={{ color: 'var(--gok-red)', fontWeight: 600 }}>{draft.diagnosis.status}</span>} />
          <KV k="관련 조항"      v={<span style={{ color: 'var(--gok-blue)', fontWeight: 600 }}>{draft.diagnosis.law}</span>} />
          <KV k="유사 처분 사례" v={draft.diagnosis.precedent} />
        </Section>

        <div style={{ marginTop: 18, padding: 14, background: 'var(--bg-tint-blue)', borderRadius: 10, fontSize: 13, color: 'var(--gok-blue)', lineHeight: 1.55 }}>
          이 문의글은 <b>한국개인정보보호협회 등록 전문가 12명</b>에게 전달돼요. 보통 24시간 안에 답변을 받을 수 있어요.
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <button style={{ background: 'white', border: '1px solid var(--border-default)', color: 'var(--fg-1)', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>임시저장</button>
          <button style={{ background: 'var(--gok-blue)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>전문가에게 보내기 →</button>
        </div>
      </div>
    </div>
  );
}

(window as any).InquiryGen = InquiryGen;
