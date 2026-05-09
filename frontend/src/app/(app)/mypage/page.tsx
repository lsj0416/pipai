'use client';

import { useState, useEffect } from 'react';
import { upsertProfile, getProfile } from '@/lib/api/profile';

// ── 섹션 메타 ────────────────────────────────────────────────────────────────
const SECTIONS = [
  '기본정보', '담당자 정보', '사업자 규모', '개인정보 처리 현황',
  '처리 위탁·제공 현황', '처리 환경', '안전조치 현황', '마케팅·광고 활용',
  '성장 시나리오', '약관 동의',
];

// ── 선택지 상수 ──────────────────────────────────────────────────────────────
const INDUSTRIES = [
  '광업', '제조업', '건설업', '운수업', '농업·임업·어업',
  '도매·소매업', '음식점업', '숙박업', '교육서비스업', '정보통신업',
  '전문·과학·기술서비스업', '보건업·사회복지서비스업', '예술·스포츠·여가서비스업',
  '기타 서비스업', '기타',
];

const REVENUE_RANGES = [
  '0 ~ 10억원 미만', '10억 ~ 30억원 미만', '30억 ~ 50억원 미만',
  '50억 ~ 80억원 미만', '80억 ~ 120억원 미만', '120억 ~ 400억원 미만',
  '400억 ~ 600억원 미만', '600억 ~ 800억원 미만', '800억 ~ 1,000억원 미만',
  '1,000억 ~ 1,500억원 미만', '1,500억원 이상',
];

const DATA_SUBJECT_RANGES: { label: string; trigger: string | null }[] = [
  { label: '1천명 미만', trigger: null },
  { label: '1천 ~ 1만명 미만', trigger: null },
  { label: '1만 ~ 5만명 미만', trigger: null },
  { label: '5만 ~ 10만명 미만', trigger: '출처 고지 의무 시작 (시행령 제15조의2)' },
  { label: '10만 ~ 50만명 미만', trigger: null },
  { label: '50만 ~ 100만명 미만', trigger: '출처 고지 의무 확대' },
  { label: '100만 ~ 1,000만명 미만', trigger: 'CPO 자격 강화 (시행령 제32조)' },
  { label: '1,000만명 이상', trigger: '10% 징벌적 과징금 대상' },
];

// ── 폼 상태 타입 ─────────────────────────────────────────────────────────────
interface FormState {
  s1_companyName: string; s1_repName: string; s1_bizNo: string;
  s1_entityType: string; s1_foundingYear: string; s1_phone: string; s1_address: string;
  s2_name: string; s2_title: string; s2_email: string; s2_phone: string;
  s3_industry: string; s3_industryDetail: string; s3_employees: string;
  s3_revenue: string; s3_largeAssets: string;
  s4_subjectRange: string; s4_general: string[]; s4_uniqueId: string[];
  s4_sensitive: string[]; s4_credit: string[]; s4_location: string[];
  s4_methods: string[]; s4_purposes: string[];
  s5_delegation: string; s5_delegatees: string[]; s5_contract: string;
  s5_provision: string; s5_provisionPurpose: string;
  s5_overseas: string; s5_overseasCountry: string;
  s6_channels: string[]; s6_websiteUrl: string; s6_appName: string;
  s6_cctv: string; s6_cctvLoc: string[]; s6_cctvSignage: string; s6_system: string;
  s7_policy: string; s7_policyUrl: string; s7_cpo: string; s7_cpoTitle: string;
  s7_internalPlan: string; s7_encryption: string; s7_accessLog: string;
  s8_marketing: string; s8_channels: string[]; s8_consent: string;
  s9_plans: string[]; s9_employees: string; s9_revenue: string;
  s9_subjectScale: string; s9_newBiz: string;
  s10_terms: boolean; s10_privacy: boolean; s10_marketing: boolean; s10_dataUsage: boolean;
}

const INIT: FormState = {
  s1_companyName: '', s1_repName: '', s1_bizNo: '', s1_entityType: '',
  s1_foundingYear: '', s1_phone: '', s1_address: '',
  s2_name: '', s2_title: '', s2_email: '', s2_phone: '',
  s3_industry: '', s3_industryDetail: '', s3_employees: '', s3_revenue: '', s3_largeAssets: '',
  s4_subjectRange: '', s4_general: [], s4_uniqueId: [], s4_sensitive: [],
  s4_credit: [], s4_location: [], s4_methods: [], s4_purposes: [],
  s5_delegation: '', s5_delegatees: [], s5_contract: '', s5_provision: '',
  s5_provisionPurpose: '', s5_overseas: '', s5_overseasCountry: '',
  s6_channels: [], s6_websiteUrl: '', s6_appName: '',
  s6_cctv: '', s6_cctvLoc: [], s6_cctvSignage: '', s6_system: '',
  s7_policy: '', s7_policyUrl: '', s7_cpo: '', s7_cpoTitle: '',
  s7_internalPlan: '', s7_encryption: '', s7_accessLog: '',
  s8_marketing: '', s8_channels: [], s8_consent: '',
  s9_plans: [], s9_employees: '', s9_revenue: '', s9_subjectScale: '', s9_newBiz: '',
  s10_terms: false, s10_privacy: false, s10_marketing: false, s10_dataUsage: false,
};

const STORAGE_KEY = 'pipai_mypage_form';

// ── 유틸 ─────────────────────────────────────────────────────────────────────
const toggle = (arr: string[], val: string): string[] =>
  arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

const formatBizNo = (v: string): string => {
  const n = v.replace(/\D/g, '');
  if (n.length <= 3) return n;
  if (n.length <= 5) return `${n.slice(0, 3)}-${n.slice(3)}`;
  return `${n.slice(0, 3)}-${n.slice(3, 5)}-${n.slice(5, 10)}`;
};

const getCompanySize = (emp: string): string => {
  const n = parseInt(emp) || 0;
  if (n <= 0) return '';
  if (n <= 4) return '소상공인';
  if (n <= 49) return '소기업';
  if (n <= 299) return '중기업';
  if (n <= 999) return '중견기업';
  return '대기업';
};

function isStepValid(step: number, f: FormState): boolean {
  switch (step) {
    case 0: return !!(f.s1_companyName && f.s1_repName && f.s1_bizNo && f.s1_entityType && f.s1_foundingYear && f.s1_address);
    case 1: return !!(f.s2_name && f.s2_email && f.s2_phone);
    case 2: return !!(f.s3_industry && f.s3_employees && f.s3_revenue && f.s3_largeAssets);
    case 3: return !!(f.s4_subjectRange) &&
      (f.s4_general.length + f.s4_uniqueId.length + f.s4_sensitive.length + f.s4_credit.length + f.s4_location.length) > 0 &&
      f.s4_methods.length > 0 && f.s4_purposes.length > 0;
    case 4: return !!(f.s5_delegation && f.s5_provision && f.s5_overseas);
    case 5: return f.s6_channels.length > 0 && !!(f.s6_cctv && f.s6_system);
    case 6: return !!(f.s7_policy);
    case 7: return !!(f.s8_marketing);
    case 8: return true;
    case 9: return f.s10_terms && f.s10_privacy;
    default: return false;
  }
}

// ── 소형 UI 컴포넌트 ─────────────────────────────────────────────────────────
function WarnBadge({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: '#FEF9C3', color: '#854D0E',
      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
      marginLeft: 8, whiteSpace: 'nowrap' as const,
    }}>⚠ {text}</span>
  );
}

function LawBadge({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: 'var(--bg-tint-blue)', color: 'var(--gok-blue)',
      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
      marginLeft: 8, whiteSpace: 'nowrap' as const,
    }}>§ {text}</span>
  );
}

function LlmExcl() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 600, color: 'var(--fg-3)',
      background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)',
      padding: '1px 5px', borderRadius: 3, marginLeft: 6,
    }}>AI 미전달</span>
  );
}

function Req() {
  return <span style={{ color: 'var(--gok-red)', marginLeft: 2 }}>*</span>;
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--fg-2)', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14,
  border: '1px solid var(--border-default)', borderRadius: 8,
  fontFamily: 'var(--font-body)', outline: 'none',
  background: 'white', color: 'var(--fg-1)', boxSizing: 'border-box' as const,
};

const fieldWrap: React.CSSProperties = { marginBottom: 18 };

const radioLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  cursor: 'pointer', fontSize: 14, color: 'var(--fg-1)',
  padding: '6px 0',
};

const checkLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  cursor: 'pointer', fontSize: 14, color: 'var(--fg-1)',
};

const subIndent: React.CSSProperties = {
  marginLeft: 20, marginTop: 10,
  padding: '12px 14px',
  background: 'var(--bg-canvas)',
  borderLeft: '2px solid var(--border-subtle)',
  borderRadius: '0 8px 8px 0',
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function MyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INIT);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  const set = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }));

  // 마운트 후 localStorage에서 복원 (hydration mismatch 방지)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setForm({ ...INIT, ...JSON.parse(saved) as Partial<FormState> });
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    getProfile(token).then(res => {
      if (res.success && res.data) {
        const p = res.data;
        setForm(prev => ({
          ...prev,
          s3_industry: p.businessType ?? prev.s3_industry,
          s3_employees: p.employeeCount != null ? String(p.employeeCount) : prev.s3_employees,
          s3_revenue: p.annualRevenue ?? prev.s3_revenue,
          s4_general: p.personalDataItems ? p.personalDataItems.split(',').filter(Boolean) : prev.s4_general,
          s4_sensitive: p.sensitiveDataTypes ? p.sensitiveDataTypes.split(',').filter(Boolean) : prev.s4_sensitive,
          s7_policy: p.hasPrivacyPolicy === true ? 'yes' : p.hasPrivacyPolicy === false ? 'no' : prev.s7_policy,
        }));
      }
    }).catch(() => {});
  }, [mounted]);

  const saveToBackend = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const allDataItems = [...form.s4_general, ...form.s4_uniqueId, ...form.s4_credit, ...form.s4_location];
      await upsertProfile(token, {
        businessType: form.s3_industry,
        employeeCount: parseInt(form.s3_employees) || null,
        annualRevenue: form.s3_revenue,
        personalDataItems: allDataItems.join(','),
        hasPrivacyPolicy: form.s7_policy === 'yes',
        sensitiveDataTypes: form.s4_sensitive.join(','),
      });
      setSavedMsg('저장되었어요!');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch {
      setError('저장 중 오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!isStepValid(step, form)) return;
    if (step >= 2) await saveToBackend();
    if (step < 9) setStep(s => s + 1);
  };

  const handlePrev = () => setStep(s => Math.max(0, s - 1));

  const handleFinish = async () => {
    if (!isStepValid(9, form)) return;
    await saveToBackend();
  };

  const valid = isStepValid(step, form);
  const companySize = getCompanySize(form.s3_employees);

  // ── 섹션 1: 기본정보 ────────────────────────────────────────────────────────
  const renderS1 = () => (
    <>
      <div style={fieldWrap}>
        <label style={labelStyle}>회사명(상호명)<Req /></label>
        <input style={inputStyle} value={form.s1_companyName}
          onChange={e => set({ s1_companyName: e.target.value })} placeholder="예: 행복한아침 카페" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>대표자명<Req /><LlmExcl /></label>
        <input style={inputStyle} value={form.s1_repName}
          onChange={e => set({ s1_repName: e.target.value })} placeholder="홍길동" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>사업자등록번호<Req /><LlmExcl /></label>
        <input style={inputStyle} value={form.s1_bizNo}
          onChange={e => set({ s1_bizNo: formatBizNo(e.target.value) })}
          placeholder="000-00-00000" maxLength={12} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>법인구분<Req /></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['법인', '개인'].map(v => (
              <label key={v} style={radioLabel}>
                <input type="radio" name="entityType" value={v}
                  checked={form.s1_entityType === v}
                  onChange={() => set({ s1_entityType: v })} />
                {v}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>설립연도<Req /></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['1년 미만', '1~3년', '3~7년', '7년 이상'].map(v => (
              <label key={v} style={radioLabel}>
                <input type="radio" name="foundingYear" value={v}
                  checked={form.s1_foundingYear === v}
                  onChange={() => set({ s1_foundingYear: v })} />
                {v}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>회사 대표번호</label>
        <input style={inputStyle} value={form.s1_phone}
          onChange={e => set({ s1_phone: e.target.value })} placeholder="02-0000-0000" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>소재지<Req /></label>
        <input style={inputStyle} value={form.s1_address}
          onChange={e => set({ s1_address: e.target.value })} placeholder="예: 서울특별시 강남구 테헤란로 1길 1" />
      </div>
    </>
  );

  // ── 섹션 2: 담당자 정보 ─────────────────────────────────────────────────────
  const renderS2 = () => (
    <>
      <p style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 20, lineHeight: 1.6 }}>
        담당자 정보는 문의글 자동 생성 시에만 활용됩니다.
      </p>
      <div style={fieldWrap}>
        <label style={labelStyle}>담당자명<Req /></label>
        <input style={inputStyle} value={form.s2_name}
          onChange={e => set({ s2_name: e.target.value })} placeholder="홍길동" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>담당자 직함</label>
        <input style={inputStyle} value={form.s2_title}
          onChange={e => set({ s2_title: e.target.value })} placeholder="예: 대표, 경영지원팀장" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>담당자 이메일<Req /></label>
        <input style={inputStyle} type="email" value={form.s2_email}
          onChange={e => set({ s2_email: e.target.value })} placeholder="example@company.com" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>담당자 연락처<Req /><LlmExcl /></label>
        <input style={inputStyle} value={form.s2_phone}
          onChange={e => set({ s2_phone: e.target.value })} placeholder="010-0000-0000" />
      </div>
    </>
  );

  // ── 섹션 3: 사업자 규모 ─────────────────────────────────────────────────────
  const renderS3 = () => (
    <>
      <div style={fieldWrap}>
        <label style={labelStyle}>업종 대분류<Req /></label>
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.s3_industry}
          onChange={e => set({ s3_industry: e.target.value })}>
          <option value="">선택하세요</option>
          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>업종 세부</label>
        <input style={inputStyle} value={form.s3_industryDetail}
          onChange={e => set({ s3_industryDetail: e.target.value })}
          placeholder="예: 온라인 의류 쇼핑몰" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>상시 근로자 수 (명)<Req /></label>
        <input style={inputStyle} type="number" min="0" value={form.s3_employees}
          onChange={e => set({ s3_employees: e.target.value })} placeholder="0" />
        {companySize && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-tint-blue)', borderRadius: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--fg-3)' }}>예상 분류: </span>
            <span style={{ color: 'var(--gok-blue)', fontWeight: 700 }}>{companySize}</span>
            <span style={{ color: 'var(--fg-3)', fontSize: 11, marginLeft: 8 }}>정확한 분류는 저장 후 확인 가능해요</span>
          </div>
        )}
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>직전 사업연도 매출액<Req /></label>
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.s3_revenue}
          onChange={e => set({ s3_revenue: e.target.value })}>
          <option value="">선택하세요</option>
          {REVENUE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>자산총액 5,000억원 이상 여부<Req /></label>
        <div style={{ display: 'flex', gap: 24 }}>
          {['예', '아니오'].map(v => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="largeAssets" value={v}
                checked={form.s3_largeAssets === v}
                onChange={() => set({ s3_largeAssets: v })} />
              {v}
            </label>
          ))}
        </div>
      </div>
    </>
  );

  // ── 섹션 4: 개인정보 처리 현황 ──────────────────────────────────────────────
  const renderS4 = () => (
    <>
      <div style={fieldWrap}>
        <label style={labelStyle}>정보주체 규모<Req /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {DATA_SUBJECT_RANGES.map(({ label, trigger }) => (
            <label key={label} style={radioLabel}>
              <input type="radio" name="subjectRange" value={label}
                checked={form.s4_subjectRange === label}
                onChange={() => set({ s4_subjectRange: label })} />
              {label}
              {trigger && form.s4_subjectRange === label && <LawBadge text={trigger} />}
            </label>
          ))}
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>수집 정보 유형<Req /> <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--fg-3)' }}>(해당 항목 모두 선택)</span></label>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', marginBottom: 6 }}>일반 개인정보</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
          {['성명', '연락처(전화번호)', '주소', '이메일', '생년월일', '성별', '직업·소속'].map(v => (
            <label key={v} style={checkLabel}>
              <input type="checkbox" checked={form.s4_general.includes(v)}
                onChange={() => set({ s4_general: toggle(form.s4_general, v) })} />
              {v}
            </label>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#B45309', marginBottom: 6 }}>고유식별정보 ★ (제24조의2 적용)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
          {['주민등록번호', '운전면허번호', '외국인등록번호', '여권번호'].map(v => (
            <label key={v} style={checkLabel}>
              <input type="checkbox" checked={form.s4_uniqueId.includes(v)}
                onChange={() => set({ s4_uniqueId: toggle(form.s4_uniqueId, v) })} />
              {v}
            </label>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gok-red)', marginBottom: 6 }}>민감정보 ★ (제23조 적용)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
          {['사상·신념', '노조·정당 가입 여부', '정치적 견해', '건강·의료정보', '성생활 정보', '유전정보', '범죄경력 정보', '인종·민족 정보'].map(v => (
            <label key={v} style={checkLabel}>
              <input type="checkbox" checked={form.s4_sensitive.includes(v)}
                onChange={() => set({ s4_sensitive: toggle(form.s4_sensitive, v) })} />
              {v}
            </label>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', marginBottom: 6 }}>신용정보 (신용정보법 적용)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
          {['신용카드 정보', '계좌번호', '신용평점'].map(v => (
            <label key={v} style={checkLabel}>
              <input type="checkbox" checked={form.s4_credit.includes(v)}
                onChange={() => set({ s4_credit: toggle(form.s4_credit, v) })} />
              {v}
            </label>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', marginBottom: 6 }}>위치·영상정보</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {['위치정보(GPS)', 'CCTV 영상 ★(제25조)', '차량번호'].map(v => (
            <label key={v} style={checkLabel}>
              <input type="checkbox" checked={form.s4_location.includes(v)}
                onChange={() => set({ s4_location: toggle(form.s4_location, v) })} />
              {v}
            </label>
          ))}
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>수집 방법<Req /></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {['회원가입', '주문·결제', '오프라인 서면 작성', '전화 상담', '이메일·메신저', 'CCTV 촬영', '자동 수집 (쿠키, 접속로그)', '제3자로부터 제공받음'].map(v => (
            <label key={v} style={checkLabel}>
              <input type="checkbox" checked={form.s4_methods.includes(v)}
                onChange={() => set({ s4_methods: toggle(form.s4_methods, v) })} />
              {v}
            </label>
          ))}
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>이용 목적<Req /></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {['서비스 제공 (계약 이행)', '회원 관리', '마케팅·광고 (영리 목적)', '통계 분석', '채용·인사 관리', '법적 의무 이행'].map(v => (
            <label key={v} style={checkLabel}>
              <input type="checkbox" checked={form.s4_purposes.includes(v)}
                onChange={() => set({ s4_purposes: toggle(form.s4_purposes, v) })} />
              {v}
            </label>
          ))}
        </div>
      </div>
    </>
  );

  // ── 섹션 5: 처리 위탁·제공 현황 ─────────────────────────────────────────────
  const renderS5 = () => (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-2)', marginBottom: 12 }}>5-1. 처리 위탁 (제26조)</div>
      <div style={fieldWrap}>
        <label style={labelStyle}>위탁 여부<Req /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ v: 'yes', l: '위탁함' }, { v: 'no', l: '위탁 안 함' }, { v: 'unknown', l: '잘 모르겠음' }].map(({ v, l }) => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="delegation" value={v}
                checked={form.s5_delegation === v}
                onChange={() => set({ s5_delegation: v })} />
              {l}
            </label>
          ))}
        </div>
      </div>

      {form.s5_delegation === 'yes' && (
        <div style={subIndent}>
          <div style={fieldWrap}>
            <label style={labelStyle}>수탁자 유형</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {['배송업체', '결제대행 (PG사)', '고객센터·CS', '마케팅 대행', '클라우드 서비스 (AWS, GCP 등)', '시스템 개발·운영 외주', '데이터 분석', '기타'].map(v => (
                <label key={v} style={checkLabel}>
                  <input type="checkbox" checked={form.s5_delegatees.includes(v)}
                    onChange={() => set({ s5_delegatees: toggle(form.s5_delegatees, v) })} />
                  {v}
                </label>
              ))}
            </div>
          </div>
          <div style={{ ...fieldWrap, marginBottom: 0 }}>
            <label style={labelStyle}>위탁계약 체결 여부</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { v: 'written', l: '서면 계약 체결함' },
                { v: 'verbal', l: '구두 계약만 있음', warn: true },
                { v: 'none', l: '계약 없음', warn: true },
                { v: 'unknown', l: '모르겠음' },
              ].map(({ v, l, warn }) => (
                <label key={v} style={radioLabel}>
                  <input type="radio" name="delegationContract" value={v}
                    checked={form.s5_contract === v}
                    onChange={() => set({ s5_contract: v })} />
                  {l}
                  {warn && form.s5_contract === v && <WarnBadge text="위반 가능성" />}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-2)', margin: '20px 0 12px' }}>5-2. 제3자 제공 (제17조)</div>
      <div style={fieldWrap}>
        <label style={labelStyle}>제공 여부<Req /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ v: 'yes', l: '제공함' }, { v: 'no', l: '제공 안 함' }, { v: 'unknown', l: '잘 모르겠음' }].map(({ v, l }) => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="provision" value={v}
                checked={form.s5_provision === v}
                onChange={() => set({ s5_provision: v })} />
              {l}
            </label>
          ))}
        </div>
      </div>
      {form.s5_provision === 'yes' && (
        <div style={subIndent}>
          <label style={labelStyle}>제공 목적</label>
          <input style={inputStyle} value={form.s5_provisionPurpose}
            onChange={e => set({ s5_provisionPurpose: e.target.value })}
            placeholder="예: 제휴사 마케팅, 배송업체 운송 처리" />
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-2)', margin: '20px 0 12px' }}>5-3. 국외 이전 (제28조의8)</div>
      <div style={fieldWrap}>
        <label style={labelStyle}>국외 이전 여부<Req /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { v: 'yes', l: '이전됨 (해외 클라우드, 해외 본사 등)' },
            { v: 'no', l: '이전 안 됨' },
            { v: 'unknown', l: '잘 모르겠음' },
          ].map(({ v, l }) => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="overseas" value={v}
                checked={form.s5_overseas === v}
                onChange={() => set({ s5_overseas: v })} />
              {l}
            </label>
          ))}
        </div>
      </div>
      {form.s5_overseas === 'yes' && (
        <div style={subIndent}>
          <label style={labelStyle}>이전 국가</label>
          <input style={inputStyle} value={form.s5_overseasCountry}
            onChange={e => set({ s5_overseasCountry: e.target.value })}
            placeholder="예: 미국 (AWS), 일본" />
        </div>
      )}
    </>
  );

  // ── 섹션 6: 처리 환경 ───────────────────────────────────────────────────────
  const renderS6 = () => (
    <>
      <div style={fieldWrap}>
        <label style={labelStyle}>운영 채널<Req /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { v: 'offline', l: '오프라인 매장만 운영' },
            { v: 'website', l: '자체 웹사이트 운영' },
            { v: 'app', l: '모바일 앱 운영' },
            { v: 'marketplace', l: '오픈마켓 입점 (스마트스토어, 쿠팡 등)' },
            { v: 'sns', l: 'SNS 채널 (인스타그램, 카카오톡 등)' },
          ].map(({ v, l }) => (
            <div key={v}>
              <label style={checkLabel}>
                <input type="checkbox" checked={form.s6_channels.includes(v)}
                  onChange={() => set({ s6_channels: toggle(form.s6_channels, v) })} />
                {l}
              </label>
              {v === 'website' && form.s6_channels.includes('website') && (
                <div style={{ marginLeft: 24, marginTop: 6 }}>
                  <input style={{ ...inputStyle, marginTop: 0 }} value={form.s6_websiteUrl}
                    onChange={e => set({ s6_websiteUrl: e.target.value })} placeholder="https://example.com" />
                </div>
              )}
              {v === 'app' && form.s6_channels.includes('app') && (
                <div style={{ marginLeft: 24, marginTop: 6 }}>
                  <input style={{ ...inputStyle, marginTop: 0 }} value={form.s6_appName}
                    onChange={e => set({ s6_appName: e.target.value })} placeholder="앱 이름" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>CCTV 운영 여부<Req /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ v: 'yes', l: '운영함' }, { v: 'no', l: '운영 안 함' }].map(({ v, l }) => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="cctv" value={v}
                checked={form.s6_cctv === v}
                onChange={() => set({ s6_cctv: v })} />
              {l}
            </label>
          ))}
        </div>
        {form.s6_cctv === 'yes' && (
          <div style={subIndent}>
            <div style={{ ...fieldWrap }}>
              <label style={labelStyle}>설치 장소</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {['매장 내부', '매장 외부', '사무실', '주차장'].map(v => (
                  <label key={v} style={checkLabel}>
                    <input type="checkbox" checked={form.s6_cctvLoc.includes(v)}
                      onChange={() => set({ s6_cctvLoc: toggle(form.s6_cctvLoc, v) })} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>안내판 설치 여부 (제25조)</label>
              <div style={{ display: 'flex', gap: 20 }}>
                {[{ v: 'yes', l: '설치함' }, { v: 'no', l: '미설치' }].map(({ v, l }) => (
                  <label key={v} style={radioLabel}>
                    <input type="radio" name="cctvSignage" value={v}
                      checked={form.s6_cctvSignage === v}
                      onChange={() => set({ s6_cctvSignage: v })} />
                    {l}
                    {v === 'no' && form.s6_cctvSignage === 'no' && <WarnBadge text="위반 가능성" />}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>개인정보처리시스템 보유 여부<Req /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['보유함 (CRM, ERP, 회원관리 시스템 등)', '엑셀·문서로만 관리', '종이 문서로만 관리'].map(v => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="system" value={v}
                checked={form.s6_system === v}
                onChange={() => set({ s6_system: v })} />
              {v}
            </label>
          ))}
        </div>
      </div>
    </>
  );

  // ── 섹션 7: 안전조치 현황 ───────────────────────────────────────────────────
  const renderS7 = () => (
    <>
      <div style={fieldWrap}>
        <label style={labelStyle}>개인정보 처리방침 게시 여부<Req /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ v: 'yes', l: '게시함' }, { v: 'no', l: '게시 안 함' }, { v: 'unknown', l: '모르겠음' }].map(({ v, l }) => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="policy" value={v}
                checked={form.s7_policy === v}
                onChange={() => set({ s7_policy: v })} />
              {l}
            </label>
          ))}
        </div>
        {form.s7_policy === 'yes' && (
          <div style={{ ...subIndent, marginTop: 8 }}>
            <label style={labelStyle}>게시 위치 (URL 또는 매장 게시)</label>
            <input style={inputStyle} value={form.s7_policyUrl}
              onChange={e => set({ s7_policyUrl: e.target.value })}
              placeholder="https://example.com/privacy 또는 '매장 입구 게시'" />
          </div>
        )}
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>개인정보보호책임자(CPO) 지정 여부</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { v: 'yes', l: '지정함' },
            { v: 'no', l: '지정 안 함' },
            { v: 'unknown', l: 'CPO 지정 의무 있는지 모름' },
          ].map(({ v, l }) => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="cpo" value={v}
                checked={form.s7_cpo === v}
                onChange={() => set({ s7_cpo: v })} />
              {l}
            </label>
          ))}
        </div>
        {form.s7_cpo === 'yes' && (
          <div style={{ ...subIndent, marginTop: 8 }}>
            <label style={labelStyle}>책임자 직책</label>
            <input style={inputStyle} value={form.s7_cpoTitle}
              onChange={e => set({ s7_cpoTitle: e.target.value })} placeholder="예: 대표이사, 경영지원팀장" />
          </div>
        )}
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>내부관리계획 수립 여부</label>
        <div style={{ display: 'flex', gap: 24 }}>
          {[{ v: 'yes', l: '수립함' }, { v: 'no', l: '수립 안 함' }, { v: 'unknown', l: '모르겠음' }].map(({ v, l }) => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="internalPlan" value={v}
                checked={form.s7_internalPlan === v}
                onChange={() => set({ s7_internalPlan: v })} />
              {l}
            </label>
          ))}
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>개인정보 암호화 처리 여부</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['암호화 처리함', '일부만 암호화', '암호화 안 함', '모르겠음'].map(v => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="encryption" value={v}
                checked={form.s7_encryption === v}
                onChange={() => set({ s7_encryption: v })} />
              {v}
            </label>
          ))}
        </div>
      </div>

      {(form.s6_system === '보유함 (CRM, ERP, 회원관리 시스템 등)') && (
        <div style={fieldWrap}>
          <label style={labelStyle}>접속기록 보관 여부</label>
          <div style={{ display: 'flex', gap: 24 }}>
            {[{ v: 'yes', l: '보관함' }, { v: 'no', l: '보관 안 함' }, { v: 'unknown', l: '모르겠음' }].map(({ v, l }) => (
              <label key={v} style={radioLabel}>
                <input type="radio" name="accessLog" value={v}
                  checked={form.s7_accessLog === v}
                  onChange={() => set({ s7_accessLog: v })} />
                {l}
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );

  // ── 섹션 8: 마케팅·광고 활용 ─────────────────────────────────────────────────
  const renderS8 = () => (
    <>
      <div style={fieldWrap}>
        <label style={labelStyle}>마케팅 정보 발송 여부<Req /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ v: 'yes', l: '발송함' }, { v: 'no', l: '발송 안 함' }].map(({ v, l }) => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="marketing" value={v}
                checked={form.s8_marketing === v}
                onChange={() => set({ s8_marketing: v })} />
              {l}
            </label>
          ))}
        </div>
      </div>

      {form.s8_marketing === 'yes' && (
        <div style={subIndent}>
          <div style={{ ...fieldWrap }}>
            <label style={labelStyle}>발송 채널</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {['문자 메시지', '이메일', '푸시 알림', '카카오톡 등 SNS'].map(v => (
                <label key={v} style={checkLabel}>
                  <input type="checkbox" checked={form.s8_channels.includes(v)}
                    onChange={() => set({ s8_channels: toggle(form.s8_channels, v) })} />
                  {v}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 0 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              마케팅 수신 동의 방식
              <span style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 400 }}>정보통신망법 제50조</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { v: 'required', l: '회원가입 시 필수 항목으로 받음', warn: true },
                { v: 'optional', l: '회원가입 시 선택 항목으로 받음', ok: true },
                { v: 'separate', l: '별도 동의 절차로 받음', ok: true },
                { v: 'none', l: '동의 받지 않음', warn: true },
                { v: 'unknown', l: '모르겠음' },
              ].map(({ v, l, warn, ok }) => (
                <label key={v} style={radioLabel}>
                  <input type="radio" name="marketingConsent" value={v}
                    checked={form.s8_consent === v}
                    onChange={() => set({ s8_consent: v })} />
                  {l}
                  {warn && form.s8_consent === v && <WarnBadge text="위반 가능성 높음" />}
                  {ok && form.s8_consent === v && (
                    <span style={{ fontSize: 11, color: '#15803D', fontWeight: 600, marginLeft: 8 }}>✓ 적법</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── 섹션 9: 성장 시나리오 ───────────────────────────────────────────────────
  const renderS9 = () => (
    <>
      <p style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 16, lineHeight: 1.6 }}>
        향후 1년 내 변화 계획을 선택하면 대시보드 성장 체크리스트가 자동 생성됩니다.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { v: 'hire', l: '직원 채용 예정' },
          { v: 'revenue', l: '매출 성장 예정' },
          { v: 'subjects', l: '정보주체 수 증가 예정' },
          { v: 'newbiz', l: '신규 사업 진출 예정' },
          { v: 'overseas', l: '해외 진출 예정' },
          { v: 'ai', l: 'AI·신기술 도입 예정' },
          { v: 'none', l: '변화 없음' },
        ].map(({ v, l }) => (
          <div key={v}>
            <label style={checkLabel}>
              <input type="checkbox" checked={form.s9_plans.includes(v)}
                onChange={() => {
                  const next = toggle(form.s9_plans, v);
                  set({ s9_plans: v === 'none' ? (next.includes('none') ? ['none'] : next) : next.filter(x => x !== 'none') });
                }} />
              {l}
            </label>
            {v === 'hire' && form.s9_plans.includes('hire') && (
              <div style={{ marginLeft: 24, marginTop: 6 }}>
                <input style={{ ...inputStyle, width: '50%' }} type="number" min="0"
                  value={form.s9_employees}
                  onChange={e => set({ s9_employees: e.target.value })}
                  placeholder="예상 직원 수 (명)" />
              </div>
            )}
            {v === 'revenue' && form.s9_plans.includes('revenue') && (
              <div style={{ marginLeft: 24, marginTop: 6 }}>
                <select style={{ ...inputStyle, width: '70%', cursor: 'pointer' }} value={form.s9_revenue}
                  onChange={e => set({ s9_revenue: e.target.value })}>
                  <option value="">예상 매출 구간 선택</option>
                  {REVENUE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
            {v === 'subjects' && form.s9_plans.includes('subjects') && (
              <div style={{ marginLeft: 24, marginTop: 6 }}>
                <select style={{ ...inputStyle, width: '70%', cursor: 'pointer' }} value={form.s9_subjectScale}
                  onChange={e => set({ s9_subjectScale: e.target.value })}>
                  <option value="">예상 규모 선택</option>
                  <option value="50000">5만명 돌파 예정</option>
                  <option value="1000000">100만명 돌파 예정</option>
                  <option value="10000000">1천만명 돌파 예정</option>
                </select>
              </div>
            )}
            {v === 'newbiz' && form.s9_plans.includes('newbiz') && (
              <div style={{ marginLeft: 24, marginTop: 6 }}>
                <input style={{ ...inputStyle, width: '70%' }} value={form.s9_newBiz}
                  onChange={e => set({ s9_newBiz: e.target.value })}
                  placeholder="분야를 입력해 주세요 (예: 헬스케어 앱)" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  // ── 섹션 10: 약관 동의 ──────────────────────────────────────────────────────
  const renderS10 = () => (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ ...checkLabel, fontSize: 15, fontWeight: 600 }}>
          <input type="checkbox" checked={form.s10_terms}
            onChange={e => set({ s10_terms: e.target.checked })} />
          [필수] 서비스 이용약관에 동의합니다
        </label>
        <label style={{ ...checkLabel, fontSize: 15, fontWeight: 600 }}>
          <input type="checkbox" checked={form.s10_privacy}
            onChange={e => set({ s10_privacy: e.target.checked })} />
          [필수] 개인정보 수집·이용에 동의합니다
        </label>
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
        <label style={{ ...checkLabel, color: 'var(--fg-3)' }}>
          <input type="checkbox" checked={form.s10_marketing}
            onChange={e => set({ s10_marketing: e.target.checked })} />
          [선택] 마케팅 정보 수신에 동의합니다
        </label>
        <label style={{ ...checkLabel, color: 'var(--fg-3)' }}>
          <input type="checkbox" checked={form.s10_dataUsage}
            onChange={e => set({ s10_dataUsage: e.target.checked })} />
          [선택] 대화 내용 저장 및 서비스 개선 활용에 동의합니다
        </label>
      </div>
    </>
  );

  // ── 섹션 렌더 맵 ─────────────────────────────────────────────────────────────
  const sectionRenderers = [
    renderS1, renderS2, renderS3, renderS4, renderS5,
    renderS6, renderS7, renderS8, renderS9, renderS10,
  ];

  const progress = ((step + 1) / SECTIONS.length) * 100;

  return (
    <div style={{ padding: '32px 32px 40px', maxWidth: 720, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em' }}>마이페이지</div>
        <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 3 }}>
          기업 프로필을 정확히 등록하면 AI 진단 정확도가 높아져요.
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>
            {SECTIONS[step]}
          </span>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{step + 1} / {SECTIONS.length}</span>
        </div>
        <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gok-blue)', borderRadius: 2, transition: 'width 300ms ease' }} />
        </div>
        {/* 섹션 탭 */}
        <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
          {SECTIONS.map((_s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: i === step ? 'var(--gok-blue)' : i < step ? 'var(--bg-tint-blue)' : 'var(--bg-canvas)',
              color: i === step ? 'white' : i < step ? 'var(--gok-blue)' : 'var(--fg-3)',
            }}>{i + 1}</button>
          ))}
        </div>
      </div>

      {/* 섹션 콘텐츠 */}
      <div style={{
        background: 'white', border: '1px solid var(--border-subtle)',
        borderRadius: 14, padding: '24px 24px', marginBottom: 20,
      }}>
        {sectionRenderers[step]?.()}
      </div>

      {/* 에러 / 저장 메시지 */}
      {error && (
        <div style={{ background: '#FEF2F2', color: 'var(--gok-red)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}
      {savedMsg && (
        <div style={{ background: '#F0FDF4', color: '#15803D', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
          {savedMsg}
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={handlePrev} disabled={step === 0} style={{
          padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          border: '1px solid var(--border-default)', background: 'white',
          color: step === 0 ? 'var(--fg-3)' : 'var(--fg-1)',
          cursor: step === 0 ? 'default' : 'pointer',
          fontFamily: 'var(--font-body)',
        }}>이전</button>

        {step < 9 ? (
          <button onClick={handleNext} disabled={!valid || saving} style={{
            padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            border: 'none', background: valid ? 'var(--gok-blue)' : 'var(--border-default)',
            color: valid ? 'white' : 'var(--fg-3)',
            cursor: valid && !saving ? 'pointer' : 'default',
            fontFamily: 'var(--font-body)',
          }}>
            {saving ? '저장 중...' : '다음'}
          </button>
        ) : (
          <button onClick={handleFinish} disabled={!valid || saving} style={{
            padding: '10px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            border: 'none', background: valid ? 'var(--gok-blue)' : 'var(--border-default)',
            color: valid ? 'white' : 'var(--fg-3)',
            cursor: valid && !saving ? 'pointer' : 'default',
            fontFamily: 'var(--font-body)',
          }}>
            {saving ? '저장 중...' : '저장 완료'}
          </button>
        )}
      </div>
    </div>
  );
}
