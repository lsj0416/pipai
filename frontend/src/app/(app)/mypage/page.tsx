'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { upsertProfile, getProfile } from '@/lib/api/profile';

// ── 섹션 메타 ────────────────────────────────────────────────────────────────
const SECTIONS = [
  '기본정보', '사업자 규모', '개인정보 처리 현황',
  '처리 위탁·제공 현황', '처리 환경', '안전조치 현황', '마케팅·광고 활용',
  '성장 시나리오',
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

const DELEGATEE_TYPES = [
  '배송업체', '결제대행 (PG사)', '고객센터·CS', '마케팅 대행',
  '클라우드 서비스 (AWS, GCP 등)', '시스템 개발·운영 외주', '데이터 분석', '기타',
];

const CONTRACT_OPTIONS = [
  { v: 'written', l: '서면 계약', warn: false },
  { v: 'verbal', l: '구두 계약만', warn: true },
  { v: 'none', l: '계약 없음', warn: true },
  { v: 'unknown', l: '불명확', warn: false },
];

const UNIQUE_ID_ITEMS = ['주민등록번호', '운전면허번호', '외국인등록번호', '여권번호'];
const CREDIT_ITEMS = ['신용카드 정보', '계좌번호', '신용평점'];
const LOCATION_ITEMS = ['위치정보(GPS)', 'CCTV 영상(제25조)', '차량번호'];

// ── 폼 상태 타입 ─────────────────────────────────────────────────────────────
interface FormState {
  s1_companyName: string; s1_repName: string; s1_bizNo: string;
  s1_entityType: string; s1_foundingYear: string; s1_phone: string; s1_address: string;
  s3_industry: string; s3_industryDetail: string; s3_employees: string;
  s3_revenue: string; s3_largeAssets: string;
  s4_subjectRange: string; s4_general: string[]; s4_generalOther: string;
  s4_uniqueId: string[]; s4_juminGround: string;
  s4_sensitive: string[]; s4_credit: string[]; s4_location: string[];
  s4_methods: string[]; s4_purposes: string[]; s4_marketingScope: string[];
  s4_b08_policy: string; s4_b08_methods: string[];
  s4_b06_retention: string; s4_b06_exitTiming: string;
  s4_b07_registration: string; s4_b07_retention: string;
  s5_delegation: string; s5_delegatees: string[];
  s5_contractPerType: Record<string, string>;
  s5_b01_disclosure: string; s5_b02_audit: string; s5_b02_education: string;
  s5_b10_serverLocation: string; s5_b10_country: string;
  s5_provision: string; s5_provisionPurpose: string;
  s5_provisionRecipients: string[]; s5_provisionConsent: string;
  s5_overseas: string; s5_overseasCountry: string;
  s6_channels: string[]; s6_websiteUrl: string; s6_appName: string;
  s6_marketplaceSource: string;
  s6_cctv: string; s6_cctvLoc: string[]; s6_cctvLocOther: string;
  s6_cctvRange: string[]; s6_cctvRetention: string;
  s6_cctvSignage: string; s6_system: string;
  s6_b05_provision: string; s6_b05_access: string;
  s7_policy: string; s7_policyUrl: string; s7_cpo: string; s7_cpoTitle: string;
  s7_internalPlan: string; s7_internalPlanCycle: string;
  s7_encryption: string; s7_accessLog: string;
  s7_b09_items: string[];
  s7_b03_items: string[];
  s7_b04_access: string; s7_b04_retired: string; s7_b04_history: string;
  s8_marketing: string; s8_channels: string[]; s8_consent: string;
  s8_consentTiming: string; s8_nightSend: string;
  s9_plans: string[]; s9_employees: string; s9_revenue: string;
  s9_subjectScale: string; s9_newBiz: string;
}

const INIT: FormState = {
  s1_companyName: '', s1_repName: '', s1_bizNo: '', s1_entityType: '',
  s1_foundingYear: '', s1_phone: '', s1_address: '',
  s3_industry: '', s3_industryDetail: '', s3_employees: '', s3_revenue: '', s3_largeAssets: '',
  s4_subjectRange: '', s4_general: [], s4_generalOther: '',
  s4_uniqueId: [], s4_juminGround: '', s4_sensitive: [],
  s4_credit: [], s4_location: [], s4_methods: [], s4_purposes: [], s4_marketingScope: [],
  s4_b08_policy: '', s4_b08_methods: [],
  s4_b06_retention: '', s4_b06_exitTiming: '',
  s4_b07_registration: '', s4_b07_retention: '',
  s5_delegation: '', s5_delegatees: [],
  s5_contractPerType: {},
  s5_b01_disclosure: '', s5_b02_audit: '', s5_b02_education: '',
  s5_b10_serverLocation: '', s5_b10_country: '',
  s5_provision: '', s5_provisionPurpose: '',
  s5_provisionRecipients: [], s5_provisionConsent: '',
  s5_overseas: '', s5_overseasCountry: '',
  s6_channels: [], s6_websiteUrl: '', s6_appName: '',
  s6_marketplaceSource: '',
  s6_cctv: '', s6_cctvLoc: [], s6_cctvLocOther: '',
  s6_cctvRange: [], s6_cctvRetention: '',
  s6_cctvSignage: '', s6_system: '',
  s6_b05_provision: '', s6_b05_access: '',
  s7_policy: '', s7_policyUrl: '', s7_cpo: '', s7_cpoTitle: '',
  s7_internalPlan: '', s7_internalPlanCycle: '', s7_encryption: '', s7_accessLog: '',
  s7_b09_items: [],
  s7_b03_items: [],
  s7_b04_access: '', s7_b04_retired: '', s7_b04_history: '',
  s8_marketing: '', s8_channels: [], s8_consent: '',
  s8_consentTiming: '', s8_nightSend: '',
  s9_plans: [], s9_employees: '', s9_revenue: '', s9_subjectScale: '', s9_newBiz: '',
};

const STORAGE_KEY = 'pipai_mypage_form';

function getMypageStorageKey(): string {
  if (typeof window === 'undefined') return STORAGE_KEY;
  const token = localStorage.getItem('accessToken');
  if (!token) return STORAGE_KEY;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const userId: string | undefined = payload.sub ?? payload.userId ?? payload.id;
    return userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
  } catch {
    return STORAGE_KEY;
  }
}

const csvToArray = (value: string | null | undefined): string[] =>
  value ? value.split(',').map(v => v.trim()).filter(Boolean) : [];

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
    case 1: return !!(f.s3_industry && f.s3_employees && f.s3_revenue && f.s3_largeAssets);
    case 2: return !!(f.s4_subjectRange) &&
      (f.s4_general.length + f.s4_uniqueId.length + f.s4_sensitive.length + f.s4_credit.length + f.s4_location.length) > 0 &&
      f.s4_methods.length > 0 && f.s4_purposes.length > 0;
    case 3: return !!(f.s5_delegation && f.s5_provision && f.s5_overseas);
    case 4: return f.s6_channels.length > 0 && !!(f.s6_cctv && f.s6_system);
    case 5: return !!(f.s7_policy);
    case 6: return !!(f.s8_marketing);
    case 7: return true;
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

function SummaryField({ label, value }: { label: string; value: string | string[] | null | undefined }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 12, color: 'var(--fg-3)', minWidth: 136, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>{display}</span>
    </div>
  );
}

function SummaryCard({ title, children, stepIdx, onEdit, hasData }: {
  title: string;
  children: React.ReactNode;
  stepIdx: number;
  onEdit: (step: number) => void;
  hasData: boolean;
}) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border-subtle)',
      borderRadius: 12, padding: '16px 20px', marginBottom: 12,
      opacity: hasData ? 1 : 0.6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasData ? 12 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{title}</span>
          {!hasData && <span style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 400 }}>미입력</span>}
        </div>
        <button onClick={() => onEdit(stepIdx)} style={{
          fontSize: 12, color: 'var(--gok-blue)', background: 'var(--bg-tint-blue)',
          border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600,
          fontFamily: 'var(--font-body)',
        }}>편집</button>
      </div>
      {hasData && <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>}
    </div>
  );
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INIT);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'form' | 'summary'>('summary');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);

  const set = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const saved = localStorage.getItem(getMypageStorageKey());
      if (saved) setForm({ ...INIT, ...JSON.parse(saved) as Partial<FormState> });
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const hasData = !!form.s1_companyName;
    if (hasData) return;
    const dismissed = sessionStorage.getItem('pipai_onboarding_dismissed');
    if (!dismissed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowOnboardingModal(true);
    } else {
       
      setShowOnboardingBanner(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(getMypageStorageKey(), JSON.stringify(form));
  }, [form, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const stepParam = searchParams.get('step');
    if (!stepParam) return;
    const nextStep = Number(stepParam);
    if (Number.isInteger(nextStep) && nextStep >= 0 && nextStep < SECTIONS.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(nextStep);
      setViewMode('form');
    }
  }, [mounted, searchParams]);

  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    getProfile(token).then(res => {
      if (res.success && res.data) {
        const p = res.data;
        setForm(prev => {
          const patch: Partial<FormState> = {
            s1_companyName: p.basicInfo.companyName ?? prev.s1_companyName,
            s1_repName: p.basicInfo.representativeName ?? prev.s1_repName,
            s1_bizNo: p.basicInfo.businessRegistrationNumber ?? prev.s1_bizNo,
            s1_entityType: p.basicInfo.entityType ?? prev.s1_entityType,
            s1_foundingYear: p.basicInfo.foundingYear ?? prev.s1_foundingYear,
            s1_phone: p.basicInfo.companyPhone ?? prev.s1_phone,
            s1_address: p.basicInfo.companyAddress ?? prev.s1_address,
            s3_industry: p.overview.businessType ?? prev.s3_industry,
            s3_industryDetail: p.overview.industryDetail ?? prev.s3_industryDetail,
            s3_employees: p.overview.employeeCount != null ? String(p.overview.employeeCount) : prev.s3_employees,
            s3_revenue: p.overview.annualRevenue ?? prev.s3_revenue,
            s3_largeAssets: p.overview.largeAssets ?? prev.s3_largeAssets,
            s4_subjectRange: p.overview.subjectRange ?? prev.s4_subjectRange,
            s7_policy: p.overview.hasPrivacyPolicy === true ? 'yes' : p.overview.hasPrivacyPolicy === false ? 'no' : prev.s7_policy,
            s4_generalOther: p.overview.generalOther ?? prev.s4_generalOther,
            s4_methods: csvToArray(p.overview.collectionMethods).length > 0 ? csvToArray(p.overview.collectionMethods) : prev.s4_methods,
            s4_purposes: csvToArray(p.overview.collectionPurposes).length > 0 ? csvToArray(p.overview.collectionPurposes) : prev.s4_purposes,
            s4_marketingScope: csvToArray(p.overview.marketingScope).length > 0 ? csvToArray(p.overview.marketingScope) : prev.s4_marketingScope,
            s5_delegation: p.overview.delegationStatus ?? prev.s5_delegation,
            s5_delegatees: csvToArray(p.overview.delegateeTypes).length > 0 ? csvToArray(p.overview.delegateeTypes) : prev.s5_delegatees,
            s5_overseas: p.overview.overseasTransferStatus ?? prev.s5_overseas,
            s5_overseasCountry: p.overview.overseasTransferCountry ?? prev.s5_overseasCountry,
            s6_cctv: p.overview.cctvOperationStatus ?? prev.s6_cctv,
            s6_system: p.overview.systemStatus ?? prev.s6_system,
            s7_encryption: p.overview.encryptionStatus ?? prev.s7_encryption,
            s4_b08_policy: p.destruction.policyStatus ?? prev.s4_b08_policy,
            s4_b08_methods: csvToArray(p.destruction.methods).length > 0 ? csvToArray(p.destruction.methods) : prev.s4_b08_methods,
            s4_b06_retention: p.employmentRetention.documentRetention ?? prev.s4_b06_retention,
            s4_b06_exitTiming: p.employmentRetention.formerEmployeeDestructionTiming ?? prev.s4_b06_exitTiming,
            s4_b07_registration: p.partnerContactHandling.dbRegistration ?? prev.s4_b07_registration,
            s4_b07_retention: p.partnerContactHandling.retentionPolicy ?? prev.s4_b07_retention,
            s7_b09_items: csvToArray(p.privacyPolicyCompleteness.includedItems).length > 0 ? csvToArray(p.privacyPolicyCompleteness.includedItems) : prev.s7_b09_items,
            s5_b01_disclosure: p.delegationGovernance.disclosureStatus ?? prev.s5_b01_disclosure,
            s5_b02_audit: p.delegationGovernance.auditStatus ?? prev.s5_b02_audit,
            s5_b02_education: p.delegationGovernance.educationStatus ?? prev.s5_b02_education,
            s5_b10_serverLocation: p.cloudHosting.serverLocation ?? prev.s5_b10_serverLocation,
            s5_b10_country: p.cloudHosting.overseasServerCountry ?? prev.s5_b10_country,
            s6_b05_provision: p.cctvControls.externalProvision ?? prev.s6_b05_provision,
            s6_b05_access: p.cctvControls.accessControl ?? prev.s6_b05_access,
            s7_b03_items: csvToArray(p.securityControls.encryptedDataItems).length > 0 ? csvToArray(p.securityControls.encryptedDataItems) : prev.s7_b03_items,
            s7_b04_access: p.securityControls.accessControlSeparation ?? prev.s7_b04_access,
            s7_b04_retired: p.securityControls.retiredAccessRevocation ?? prev.s7_b04_retired,
            s7_b04_history: p.securityControls.accessChangeHistoryStatus ?? prev.s7_b04_history,
            s7_cpo: p.cpoInfo.status ?? prev.s7_cpo,
            s7_cpoTitle: p.cpoInfo.title ?? prev.s7_cpoTitle,
            s6_channels: csvToArray(p.operatingInfo.channels ?? '').length > 0 ? csvToArray(p.operatingInfo.channels!) : prev.s6_channels,
            s7_policyUrl: p.operatingInfo.privacyPolicyUrl ?? prev.s7_policyUrl,
            s8_marketing: p.marketingInfo.status ?? prev.s8_marketing,
            s8_consent: p.marketingInfo.consentType ?? prev.s8_consent,
            s8_nightSend: p.marketingInfo.nightSend ?? prev.s8_nightSend,
            s6_cctvSignage: p.cctvAdditional.signageStatus ?? prev.s6_cctvSignage,
            s6_cctvRange: csvToArray(p.cctvAdditional.range ?? '').length > 0 ? csvToArray(p.cctvAdditional.range!) : prev.s6_cctvRange,
            s7_accessLog: p.accessLogInfo.status ?? prev.s7_accessLog,
            s4_juminGround: p.juminInfo.collectionGround ?? prev.s4_juminGround,
            s5_provision: p.provisionInfo.status ?? prev.s5_provision,
            s5_provisionPurpose: p.provisionInfo.purpose ?? prev.s5_provisionPurpose,
            s5_provisionRecipients: csvToArray(p.provisionInfo.recipients).length > 0 ? csvToArray(p.provisionInfo.recipients) : prev.s5_provisionRecipients,
            s5_provisionConsent: p.provisionInfo.consentStatus ?? prev.s5_provisionConsent,
            s7_internalPlan: p.internalPlanInfo.status ?? prev.s7_internalPlan,
            s7_internalPlanCycle: p.internalPlanInfo.cycle ?? prev.s7_internalPlanCycle,
            s9_plans: csvToArray(p.futurePlan.plans).length > 0 ? csvToArray(p.futurePlan.plans) : prev.s9_plans,
            s9_employees: p.futurePlan.employees ?? prev.s9_employees,
            s9_revenue: p.futurePlan.revenue ?? prev.s9_revenue,
            s9_subjectScale: p.futurePlan.subjectScale ?? prev.s9_subjectScale,
            s9_newBiz: p.futurePlan.newBiz ?? prev.s9_newBiz,
            s6_websiteUrl: p.cctvExtra.websiteUrl ?? prev.s6_websiteUrl,
            s6_appName: p.cctvExtra.appName ?? prev.s6_appName,
            s6_marketplaceSource: p.cctvExtra.marketplaceSource ?? prev.s6_marketplaceSource,
            s6_cctvLoc: csvToArray(p.cctvExtra.cctvLoc).length > 0 ? csvToArray(p.cctvExtra.cctvLoc) : prev.s6_cctvLoc,
            s6_cctvLocOther: p.cctvExtra.cctvLocOther ?? prev.s6_cctvLocOther,
            s6_cctvRetention: p.cctvExtra.cctvRetention ?? prev.s6_cctvRetention,
            s8_channels: csvToArray(p.marketingExtra.channels).length > 0 ? csvToArray(p.marketingExtra.channels) : prev.s8_channels,
            s8_consentTiming: p.marketingExtra.consentTiming ?? prev.s8_consentTiming,
          };
          if (p.delegationContracts.contractPerType) {
            try {
              const parsed = JSON.parse(p.delegationContracts.contractPerType) as Record<string, string>;
              patch.s5_contractPerType = parsed;
            } catch {}
          }
          if (p.overview.personalDataItems) {
            const allItems = csvToArray(p.overview.personalDataItems);
            patch.s4_general = allItems.filter(x => !UNIQUE_ID_ITEMS.includes(x) && !CREDIT_ITEMS.includes(x) && !LOCATION_ITEMS.includes(x));
            patch.s4_uniqueId = allItems.filter(x => UNIQUE_ID_ITEMS.includes(x));
            patch.s4_credit = allItems.filter(x => CREDIT_ITEMS.includes(x));
            patch.s4_location = allItems.filter(x => LOCATION_ITEMS.includes(x));
          }
          if (p.overview.sensitiveDataTypes) {
            patch.s4_sensitive = csvToArray(p.overview.sensitiveDataTypes);
          }
          return { ...prev, ...patch };
        });
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
      if (form.s4_general.includes('기타') && form.s4_generalOther) {
        allDataItems.push(form.s4_generalOther);
      }
      await upsertProfile(token, {
        basicInfo: {
          companyName: form.s1_companyName || null,
          representativeName: form.s1_repName || null,
          businessRegistrationNumber: form.s1_bizNo || null,
          entityType: form.s1_entityType || null,
          foundingYear: form.s1_foundingYear || null,
          companyPhone: form.s1_phone || null,
          companyAddress: form.s1_address || null,
        },
        overview: {
          businessType: form.s3_industry || null,
          industryDetail: form.s3_industryDetail || null,
          employeeCount: parseInt(form.s3_employees) || null,
          annualRevenue: form.s3_revenue || null,
          largeAssets: form.s3_largeAssets || null,
          subjectRange: form.s4_subjectRange || null,
          personalDataItems: allDataItems.join(',') || null,
          hasPrivacyPolicy: form.s7_policy === 'yes' ? true : form.s7_policy === 'no' ? false : null,
          sensitiveDataTypes: form.s4_sensitive.join(',') || null,
          generalOther: form.s4_generalOther || null,
          collectionMethods: form.s4_methods.join(',') || null,
          collectionPurposes: form.s4_purposes.join(',') || null,
          marketingScope: form.s4_marketingScope.join(',') || null,
          delegationStatus: form.s5_delegation || null,
          delegateeTypes: form.s5_delegatees.join(',') || null,
          overseasTransferStatus: form.s5_overseas || null,
          overseasTransferCountry: form.s5_overseasCountry || null,
          cctvOperationStatus: form.s6_cctv || null,
          systemStatus: form.s6_system || null,
          encryptionStatus: form.s7_encryption || null,
        },
        destruction: {
          policyStatus: form.s4_b08_policy || null,
          methods: form.s4_b08_methods.join(',') || null,
        },
        employmentRetention: {
          documentRetention: form.s4_b06_retention || null,
          formerEmployeeDestructionTiming: form.s4_b06_exitTiming || null,
        },
        partnerContactHandling: {
          dbRegistration: form.s4_b07_registration || null,
          retentionPolicy: form.s4_b07_retention || null,
        },
        privacyPolicyCompleteness: {
          includedItems: form.s7_b09_items.join(',') || null,
        },
        delegationGovernance: {
          disclosureStatus: form.s5_b01_disclosure || null,
          auditStatus: form.s5_b02_audit || null,
          educationStatus: form.s5_b02_education || null,
        },
        cloudHosting: {
          serverLocation: form.s5_b10_serverLocation || null,
          overseasServerCountry: form.s5_b10_country || null,
        },
        cctvControls: {
          externalProvision: form.s6_b05_provision || null,
          accessControl: form.s6_b05_access || null,
        },
        securityControls: {
          encryptedDataItems: form.s7_b03_items.join(',') || null,
          accessControlSeparation: form.s7_b04_access || null,
          retiredAccessRevocation: form.s7_b04_retired || null,
          accessChangeHistoryStatus: form.s7_b04_history || null,
        },
        cpoInfo: { status: form.s7_cpo || null, title: form.s7_cpoTitle || null },
        operatingInfo: { channels: form.s6_channels.join(',') || null, privacyPolicyUrl: form.s7_policyUrl || null },
        delegationContracts: {
          contractPerType: Object.keys(form.s5_contractPerType).length > 0 ? JSON.stringify(form.s5_contractPerType) : null,
        },
        marketingInfo: { status: form.s8_marketing || null, consentType: form.s8_consent || null, nightSend: form.s8_nightSend || null },
        cctvAdditional: { signageStatus: form.s6_cctvSignage || null, range: form.s6_cctvRange.join(',') || null },
        accessLogInfo: { status: form.s7_accessLog || null },
        juminInfo: { collectionGround: form.s4_juminGround || null },
        provisionInfo: {
          status: form.s5_provision || null,
          purpose: form.s5_provisionPurpose || null,
          recipients: form.s5_provisionRecipients.join(',') || null,
          consentStatus: form.s5_provisionConsent || null,
        },
        internalPlanInfo: { status: form.s7_internalPlan || null, cycle: form.s7_internalPlanCycle || null },
        futurePlan: {
          plans: form.s9_plans.join(',') || null,
          employees: form.s9_employees || null,
          revenue: form.s9_revenue || null,
          subjectScale: form.s9_subjectScale || null,
          newBiz: form.s9_newBiz || null,
        },
        cctvExtra: {
          websiteUrl: form.s6_websiteUrl || null,
          appName: form.s6_appName || null,
          marketplaceSource: form.s6_marketplaceSource || null,
          cctvLoc: form.s6_cctvLoc.join(',') || null,
          cctvLocOther: form.s6_cctvLocOther || null,
          cctvRetention: form.s6_cctvRetention || null,
        },
        marketingExtra: {
          channels: form.s8_channels.join(',') || null,
          consentTiming: form.s8_consentTiming || null,
        },
      });
      localStorage.setItem('dashboardNeedsRefresh', 'true');
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
    await saveToBackend();
    if (step < SECTIONS.length - 1) setStep(s => s + 1);
  };

  const handlePrev = () => setStep(s => Math.max(0, s - 1));

  const handleFinish = async () => {
    if (!isStepValid(SECTIONS.length - 1, form)) return;
    await saveToBackend();
    setViewMode('summary');
  };

  const handleEditFromSummary = (targetStep: number) => {
    setStep(targetStep);
    setViewMode('form');
  };

  const handleOnboardingStart = () => {
    setShowOnboardingModal(false);
    setViewMode('form');
    setStep(0);
  };

  const handleOnboardingSkip = () => {
    sessionStorage.setItem('pipai_onboarding_dismissed', 'true');
    setShowOnboardingModal(false);
    router.push('/chat');
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 6 }}>
          {['성명', '연락처(전화번호)', '주소', '이메일', '생년월일', '성별', '직업·소속'].map(v => (
            <label key={v} style={checkLabel}>
              <input type="checkbox" checked={form.s4_general.includes(v)}
                onChange={() => set({ s4_general: toggle(form.s4_general, v) })} />
              {v}
            </label>
          ))}
          <label style={checkLabel}>
            <input type="checkbox" checked={form.s4_general.includes('기타')}
              onChange={() => set({ s4_general: toggle(form.s4_general, '기타') })} />
            기타
          </label>
        </div>
        {form.s4_general.includes('기타') && (
          <div style={{ marginBottom: 12 }}>
            <input
              style={{ ...inputStyle, fontSize: 13 }}
              value={form.s4_generalOther}
              onChange={e => set({ s4_generalOther: e.target.value })}
              placeholder="직접 입력 (예: 직원번호, 차량번호판 등)"
            />
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 600, color: '#B45309', marginBottom: 6 }}>고유식별정보 (제24조의2 적용)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          <div>
            <label style={checkLabel}>
              <input type="checkbox" checked={form.s4_uniqueId.includes('주민등록번호')}
                onChange={() => set({ s4_uniqueId: toggle(form.s4_uniqueId, '주민등록번호'), s4_juminGround: '' })} />
              주민등록번호 (제24조의2 별도 적용)
            </label>
            {form.s4_uniqueId.includes('주민등록번호') && (
              <div style={{ ...subIndent, marginTop: 6 }}>
                <label style={{ ...labelStyle, fontSize: 12 }}>수집 근거 법령이 있나요?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { v: 'law', l: '법령상 의무 (예: 세법, 근로기준법)' },
                    { v: 'consent', l: '정보주체 별도 동의' },
                    { v: 'unknown', l: '모르겠음' },
                  ].map(({ v, l }) => (
                    <label key={v} style={{ ...radioLabel, fontSize: 13 }}>
                      <input type="radio" name="juminGround" value={v}
                        checked={form.s4_juminGround === v}
                        onChange={() => set({ s4_juminGround: v })} />
                      {l}
                      {v === 'unknown' && form.s4_juminGround === 'unknown' && <WarnBadge text="위반 가능성" />}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {['운전면허번호', '외국인등록번호', '여권번호'].map(v => (
              <label key={v} style={checkLabel}>
                <input type="checkbox" checked={form.s4_uniqueId.includes(v)}
                  onChange={() => set({ s4_uniqueId: toggle(form.s4_uniqueId, v) })} />
                {v}
              </label>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gok-red)', marginBottom: 6 }}>민감정보 (제23조 적용)</div>
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
          {['위치정보(GPS)', 'CCTV 영상(제25조)', '차량번호'].map(v => (
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
        {(form.s4_methods.includes('오프라인 서면 작성') || form.s4_methods.includes('이메일·메신저')) && (
          <div style={{ ...subIndent, marginTop: 10 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>거래처 명함·연락처 정보 DB 등록 여부</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['등록하지 않음', '사내 DB·CRM에 등록함', '엑셀 등 파일로만 관리', '모르겠음'].map(v => (
                  <label key={v} style={radioLabel}>
                    <input type="radio" name="b07Registration" value={v}
                      checked={form.s4_b07_registration === v}
                      onChange={() => set({ s4_b07_registration: v, ...(v !== '사내 DB·CRM에 등록함' ? { s4_b07_retention: '' } : {}) })} />
                    {v}
                  </label>
                ))}
                {form.s4_b07_registration === '사내 DB·CRM에 등록함' && (
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gok-blue)', background: 'var(--bg-tint-blue)', padding: '6px 10px', borderRadius: 6, lineHeight: 1.5 }}>
                    ℹ 개인정보처리자로서 법적 의무(처리방침 게시, 정보주체 동의 획득, 보유기간 설정 등)가 적용됩니다.
                  </div>
                )}
              </div>
            </div>
            {form.s4_b07_registration === '사내 DB·CRM에 등록함' && (
              <div style={{ marginBottom: 0 }}>
                <label style={labelStyle}>거래 종료 후 거래처 정보 처리 방법</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {['거래 종료 즉시 파기', '일정 기간 보관 후 파기', '계속 보관 중', '모르겠음'].map(v => (
                    <label key={v} style={radioLabel}>
                      <input type="radio" name="b07Retention" value={v}
                        checked={form.s4_b07_retention === v}
                        onChange={() => set({ s4_b07_retention: v })} />
                      {v}
                      {v === '계속 보관 중' && form.s4_b07_retention === v && <WarnBadge text="보유기간 설정 권장" />}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>이용 목적<Req /></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['서비스 제공 (계약 이행)', '회원 관리', '마케팅·광고 (영리 목적)', '통계 분석', '채용·인사 관리', '법적 의무 이행'].map(v => (
            <div key={v}>
              <label style={checkLabel}>
                <input type="checkbox" checked={form.s4_purposes.includes(v)}
                  onChange={() => set({ s4_purposes: toggle(form.s4_purposes, v), ...(v === '마케팅·광고 (영리 목적)' ? { s4_marketingScope: [] } : {}) })} />
                {v}
              </label>
              {v === '마케팅·광고 (영리 목적)' && form.s4_purposes.includes(v) && (
                <div style={{ ...subIndent, marginTop: 6 }}>
                  <label style={{ ...labelStyle, fontSize: 12 }}>마케팅 활동 범위</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {['광고성 정보 전송 (문자/이메일/푸시)', '통계 분석을 통한 맞춤 광고', '제3자 광고 노출'].map(scope => (
                      <label key={scope} style={{ ...checkLabel, fontSize: 13 }}>
                        <input type="checkbox" checked={form.s4_marketingScope.includes(scope)}
                          onChange={() => set({ s4_marketingScope: toggle(form.s4_marketingScope, scope) })} />
                        {scope}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {v === '채용·인사 관리' && form.s4_purposes.includes(v) && (
                <div style={{ ...subIndent, marginTop: 6 }}>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>이력서·인사서류 보관 기간</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {['채용 후 즉시 파기', '6개월 미만 보관 후 파기', '6개월~1년 보관 후 파기', '1년 이상 보관', '별도 관리 없음'].map(rv => (
                        <label key={rv} style={radioLabel}>
                          <input type="radio" name="b06Retention" value={rv}
                            checked={form.s4_b06_retention === rv}
                            onChange={() => set({ s4_b06_retention: rv })} />
                          {rv}
                          {rv === '별도 관리 없음' && form.s4_b06_retention === rv && <WarnBadge text="확인 필요" />}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 0 }}>
                    <label style={labelStyle}>퇴사자 개인정보 파기 시점</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {['퇴직 즉시 파기', '일정 기간 보관 후 파기 (법령 근거)', '보관 중 (파기 계획 없음)', '모르겠음'].map(rv => (
                        <label key={rv} style={radioLabel}>
                          <input type="radio" name="b06ExitTiming" value={rv}
                            checked={form.s4_b06_exitTiming === rv}
                            onChange={() => set({ s4_b06_exitTiming: rv })} />
                          {rv}
                          {rv === '보관 중 (파기 계획 없음)' && form.s4_b06_exitTiming === rv && <WarnBadge text="위반 가능성" />}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>파기 절차 관리 여부</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['보유기간을 항목별로 관리하고 있음', '보유기간 지나면 삭제하고 있음 (기록 없음)', '별도 파기 절차 없음', '모르겠음'].map(v => (
            <label key={v} style={radioLabel}>
              <input type="radio" name="b08Policy" value={v}
                checked={form.s4_b08_policy === v}
                onChange={() => set({ s4_b08_policy: v, ...(v !== '보유기간을 항목별로 관리하고 있음' ? { s4_b08_methods: [] } : {}) })} />
              {v}
            </label>
          ))}
        </div>
        {form.s4_b08_policy === '보유기간을 항목별로 관리하고 있음' && (
          <div style={{ ...subIndent, marginTop: 10 }}>
            <label style={labelStyle}>파기 방법</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['완전파괴 (소각·파쇄)', '전용 소자장비 이용', '삭제', '덮어쓰기·초기화', '마스킹·구멍 뚫기 (부분 파기)', '별도 방법 없음'].map(v => (
                <label key={v} style={checkLabel}>
                  <input type="checkbox" checked={form.s4_b08_methods.includes(v)}
                    onChange={() => set({ s4_b08_methods: toggle(form.s4_b08_methods, v) })} />
                  {v}
                  {v === '별도 방법 없음' && form.s4_b08_methods.includes(v) && <WarnBadge text="위반 가능성" />}
                </label>
              ))}
            </div>
          </div>
        )}
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
            <label style={labelStyle}>수탁자 유형 및 계약 체결 여부</label>
            <p style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 10, lineHeight: 1.5 }}>
              수탁자를 선택하면 해당 수탁자와의 계약 상태를 설정할 수 있습니다.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DELEGATEE_TYPES.map(v => (
                <div key={v}>
                  <label style={checkLabel}>
                    <input type="checkbox" checked={form.s5_delegatees.includes(v)}
                      onChange={() => {
                        const next = toggle(form.s5_delegatees, v);
                        set({ s5_delegatees: next });
                        if (!next.includes(v)) {
                          const cp = { ...form.s5_contractPerType };
                          delete cp[v];
                          set({ s5_contractPerType: cp });
                        }
                      }} />
                    <span style={{ fontWeight: form.s5_delegatees.includes(v) ? 600 : 400 }}>{v}</span>
                  </label>
                  {form.s5_delegatees.includes(v) && (
                    <div style={{
                      marginLeft: 24, marginTop: 6, marginBottom: 4,
                      padding: '10px 12px',
                      background: '#FAFAFA',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      display: 'flex', flexWrap: 'wrap' as const, gap: '6px 16px',
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--fg-3)', width: '100%', marginBottom: 4, fontWeight: 600 }}>계약 체결 현황</span>
                      {CONTRACT_OPTIONS.map(({ v: cv, l: cl, warn }) => (
                        <label key={cv} style={{ ...checkLabel, fontSize: 13 }}>
                          <input
                            type="radio"
                            name={`contract_${v}`}
                            value={cv}
                            checked={form.s5_contractPerType[v] === cv}
                            onChange={() => set({ s5_contractPerType: { ...form.s5_contractPerType, [v]: cv } })}
                          />
                          {cl}
                          {warn && form.s5_contractPerType[v] === cv && <WarnBadge text="위반 가능성" />}
                        </label>
                      ))}
                      {v === '클라우드 서비스 (AWS, GCP 등)' && (
                        <div style={{ width: '100%', marginTop: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--fg-3)', display: 'block', marginBottom: 4, fontWeight: 600 }}>클라우드 서버 위치</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {['국내 서버만 사용', '국외 서버 포함 사용', '혼합 사용 (국내+국외)', '모르겠음'].map(loc => (
                              <label key={loc} style={{ ...radioLabel, fontSize: 13 }}>
                                <input type="radio" name="b10ServerLocation" value={loc}
                                  checked={form.s5_b10_serverLocation === loc}
                                  onChange={() => set({ s5_b10_serverLocation: loc, ...(!loc.includes('국외') && loc !== '혼합 사용 (국내+국외)' ? { s5_b10_country: '' } : {}) })} />
                                {loc}
                                {loc === '모르겠음' && form.s5_b10_serverLocation === loc && <WarnBadge text="서버 위치 확인 권장" />}
                              </label>
                            ))}
                            {(form.s5_b10_serverLocation === '국외 서버 포함 사용' || form.s5_b10_serverLocation === '혼합 사용 (국내+국외)') && form.s5_overseas === 'no' && (
                              <div style={{ marginTop: 6, fontSize: 12, color: '#854D0E', background: '#FEF9C3', padding: '6px 10px', borderRadius: 6 }}>
                                ⚠ 국외 서버 사용과 국외 이전 &lsquo;이전 안 됨&rsquo; 선택이 상충합니다. 내용을 확인해 주세요.
                              </div>
                            )}
                          </div>
                          {(form.s5_b10_serverLocation === '국외 서버 포함 사용' || form.s5_b10_serverLocation === '혼합 사용 (국내+국외)') && (
                            <div style={{ marginTop: 8 }}>
                              <span style={{ fontSize: 11, color: 'var(--fg-3)', display: 'block', marginBottom: 4, fontWeight: 600 }}>국외 서버 소재 국가</span>
                              <input style={inputStyle} value={form.s5_b10_country}
                                onChange={e => set({ s5_b10_country: e.target.value })}
                                placeholder="예: 미국, 일본, 싱가포르" />
                              {/EU|유럽|독일|프랑스|영국|이탈리아|스페인|네덜란드|폴란드|벨기에|스위스|오스트리아/i.test(form.s5_b10_country) && (
                                <div style={{ marginTop: 6, fontSize: 12, color: '#1D4ED8', background: '#EFF6FF', padding: '6px 10px', borderRadius: 6, lineHeight: 1.5 }}>
                                  ℹ EU·EEA 국가 포함 시 GDPR이 추가 적용될 수 있습니다. 표준계약조항(SCC) 체결 여부를 확인하세요.
                                </div>
                              )}
                              {/일본/i.test(form.s5_b10_country) && (
                                <div style={{ marginTop: 6, fontSize: 12, color: '#15803D', background: '#F0FDF4', padding: '6px 10px', borderRadius: 6, lineHeight: 1.5 }}>
                                  ℹ 일본은 EU GDPR 적정성 인정국입니다. 국내 개인정보보호법 제28조의8 이전 근거 요건을 확인하세요.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...fieldWrap, marginBottom: 16 }}>
            <label style={labelStyle}>처리방침 내 수탁자 공개 여부</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['처리방침에 수탁자명·업무 내용·위탁 기간 모두 공개', '일부만 공개', '공개 안 함', '모르겠음'].map(v => (
                <label key={v} style={radioLabel}>
                  <input type="radio" name="b01Disclosure" value={v}
                    checked={form.s5_b01_disclosure === v}
                    onChange={() => set({ s5_b01_disclosure: v })} />
                  {v}
                  {v === '일부만 공개' && form.s5_b01_disclosure === v && <WarnBadge text="보완 필요" />}
                  {v === '공개 안 함' && form.s5_b01_disclosure === v && <WarnBadge text="위반" />}
                </label>
              ))}
            </div>
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>수탁자 정기 점검 여부</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['연 1회 이상 점검 실시', '비정기적으로 점검', '점검하지 않음', '모르겠음'].map(v => (
                <label key={v} style={radioLabel}>
                  <input type="radio" name="b02Audit" value={v}
                    checked={form.s5_b02_audit === v}
                    onChange={() => set({ s5_b02_audit: v })} />
                  {v}
                  {v === '점검하지 않음' && form.s5_b02_audit === v && <WarnBadge text="관리·감독 의무" />}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>수탁자 개인정보 보호 교육 실시 여부</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['실시함', '실시하지 않음', '모르겠음'].map(v => (
                <label key={v} style={radioLabel}>
                  <input type="radio" name="b02Education" value={v}
                    checked={form.s5_b02_education === v}
                    onChange={() => set({ s5_b02_education: v })} />
                  {v}
                  {v === '실시하지 않음' && form.s5_b02_education === v && <WarnBadge text="교육 의무" />}
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
          <div style={fieldWrap}>
            <label style={labelStyle}>제공 목적</label>
            <input style={inputStyle} value={form.s5_provisionPurpose}
              onChange={e => set({ s5_provisionPurpose: e.target.value })}
              placeholder="예: 제휴사 마케팅, 배송업체 운송 처리" />
          </div>
          <div style={fieldWrap}>
            <label style={{ ...labelStyle, fontSize: 12 }}>제공받는 자 유형 (해당 항목 모두 선택)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['그룹 계열사', '제휴 마케팅 업체', '보험사·금융기관', '공공기관 (법령상 의무)', '기타'].map(v => (
                <label key={v} style={{ ...checkLabel, fontSize: 13 }}>
                  <input type="checkbox" checked={form.s5_provisionRecipients.includes(v)}
                    onChange={() => set({ s5_provisionRecipients: toggle(form.s5_provisionRecipients, v) })} />
                  {v}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 0 }}>
            <label style={{ ...labelStyle, fontSize: 12 }}>정보주체 동의 여부</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { v: 'yes', l: '받음' },
                { v: 'no', l: '안 받음', warn: true },
                { v: 'unknown', l: '모르겠음' },
              ].map(({ v, l, warn }) => (
                <label key={v} style={{ ...radioLabel, fontSize: 13 }}>
                  <input type="radio" name="provisionConsent" value={v}
                    checked={form.s5_provisionConsent === v}
                    onChange={() => set({ s5_provisionConsent: v })} />
                  {l}
                  {warn && form.s5_provisionConsent === v && <WarnBadge text="위반 경고" />}
                </label>
              ))}
            </div>
          </div>
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
            { v: 'marketplace', l: '오픈마켓 입점 (스마트스토어, 쿠팡 등)', sub: true },
            { v: 'sns', l: 'SNS 채널 (인스타그램, 카카오톡 등)' },
          ].map(({ v, l }) => (
            <div key={v}>
              <label style={checkLabel}>
                <input type="checkbox" checked={form.s6_channels.includes(v)}
                  onChange={() => set({ s6_channels: toggle(form.s6_channels, v), ...(v === 'marketplace' ? { s6_marketplaceSource: '' } : {}) })} />
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
              {v === 'marketplace' && form.s6_channels.includes('marketplace') && (
                <div style={{ ...subIndent, marginTop: 6 }}>
                  <label style={{ ...labelStyle, fontSize: 12 }}>고객 정보를 직접 받으시나요, 플랫폼에서 받으시나요?</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                      { v: 'platform_only', l: '플랫폼이 처리하고 우리는 받지 않음' },
                      { v: 'from_platform', l: '플랫폼에서 고객 정보를 전달받아 처리' },
                      { v: 'partial', l: '일부만 전달받음' },
                    ].map(({ v: sv, l: sl }) => (
                      <label key={sv} style={{ ...radioLabel, fontSize: 13 }}>
                        <input type="radio" name="marketplaceSource" value={sv}
                          checked={form.s6_marketplaceSource === sv}
                          onChange={() => set({ s6_marketplaceSource: sv })} />
                        {sl}
                      </label>
                    ))}
                  </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 6 }}>
                {['매장 내부', '매장 외부', '사무실', '주차장', '기타'].map(v => (
                  <label key={v} style={checkLabel}>
                    <input type="checkbox" checked={form.s6_cctvLoc.includes(v)}
                      onChange={() => set({ s6_cctvLoc: toggle(form.s6_cctvLoc, v) })} />
                    {v}
                  </label>
                ))}
              </div>
              {form.s6_cctvLoc.includes('기타') && (
                <input style={{ ...inputStyle, fontSize: 13 }} value={form.s6_cctvLocOther}
                  onChange={e => set({ s6_cctvLocOther: e.target.value })}
                  placeholder="기타 설치 장소 입력" />
              )}
            </div>
            <div style={{ ...fieldWrap }}>
              <label style={{ ...labelStyle, fontSize: 12 }}>촬영 범위</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { v: 'adjacent', l: '타인 공간 (인접 사무실, 통행로 등)이 촬영됨', warn: false },
                  { v: 'private', l: '사적 공간 (화장실, 탈의실 등) 포함', danger: true },
                  { v: 'public', l: '외부 공개 영역만 (도로 등)', warn: false },
                ].map(({ v, l, danger }) => (
                  <label key={v} style={{ ...checkLabel, fontSize: 13 }}>
                    <input type="checkbox" checked={form.s6_cctvRange.includes(v)}
                      onChange={() => set({ s6_cctvRange: toggle(form.s6_cctvRange, v) })} />
                    {l}
                    {danger && form.s6_cctvRange.includes(v) && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', marginLeft: 8 }}>🔴 위반</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ ...fieldWrap }}>
              <label style={{ ...labelStyle, fontSize: 12 }}>영상 보관 기간</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { v: '30d', l: '30일 이내' },
                  { v: '6m', l: '30일 ~ 6개월' },
                  { v: 'over6m', l: '6개월 이상', warn: true },
                  { v: 'unknown', l: '모르겠음' },
                ].map(({ v, l, warn }) => (
                  <label key={v} style={{ ...radioLabel, fontSize: 13 }}>
                    <input type="radio" name="cctvRetention" value={v}
                      checked={form.s6_cctvRetention === v}
                      onChange={() => set({ s6_cctvRetention: v })} />
                    {l}
                    {warn && form.s6_cctvRetention === v && <WarnBadge text="보관 기준 확인 필요" />}
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

            <div style={{ ...fieldWrap, marginTop: 16 }}>
              <label style={labelStyle}>CCTV 영상 외부 제공 여부</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['외부에 제공한 적 없음', '수사기관·법원 등 법령상 요청 시 제공', '그 외 제3자에게 제공함', '모르겠음'].map(v => (
                  <label key={v} style={radioLabel}>
                    <input type="radio" name="b05Provision" value={v}
                      checked={form.s6_b05_provision === v}
                      onChange={() => set({ s6_b05_provision: v })} />
                    {v}
                    {v === '그 외 제3자에게 제공함' && form.s6_b05_provision === v && <WarnBadge text="위반 가능성" />}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>CCTV 영상 접근 권한 관리 여부</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['담당자만 접근 가능하도록 관리', '일부 직원이 접근 가능', '별도 관리 없음', '모르겠음'].map(v => (
                  <label key={v} style={radioLabel}>
                    <input type="radio" name="b05Access" value={v}
                      checked={form.s6_b05_access === v}
                      onChange={() => set({ s6_b05_access: v })} />
                    {v}
                    {v === '별도 관리 없음' && form.s6_b05_access === v && <WarnBadge text="접근 통제 권장" />}
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
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>게시 위치 (URL 또는 매장 게시)</label>
              <input style={inputStyle} value={form.s7_policyUrl}
                onChange={e => set({ s7_policyUrl: e.target.value })}
                placeholder="https://example.com/privacy 또는 '매장 입구 게시'" />
            </div>
            <label style={labelStyle}>처리방침 필수 기재사항 포함 여부</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['처리 목적·수집 항목·보유기간', '제3자 제공 현황 (해당 시)', '위탁 현황 (해당 시)', 'CPO 성명·연락처', '정보주체 권리·행사 방법', '자동 수집 장치 설치·운영 (해당 시)', '파기 절차·방법'].map(v => (
                <label key={v} style={checkLabel}>
                  <input type="checkbox" checked={form.s7_b09_items.includes(v)}
                    onChange={() => set({ s7_b09_items: toggle(form.s7_b09_items, v) })} />
                  {v}
                  {!form.s7_b09_items.includes(v) && <WarnBadge text="보완 필요" />}
                </label>
              ))}
            </div>
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
                onChange={() => set({ s7_internalPlan: v, s7_internalPlanCycle: '' })} />
              {l}
            </label>
          ))}
        </div>
        {form.s7_internalPlan === 'yes' && (
          <div style={{ ...subIndent, marginTop: 8 }}>
            <label style={{ ...labelStyle, fontSize: 12 }}>내부관리계획 점검 주기는?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { v: 'annual', l: '연 1회 이상 점검·갱신' },
                { v: 'no_update', l: '작성 후 갱신 없음', warn: true },
                { v: 'unknown', l: '모르겠음' },
              ].map(({ v, l, warn }) => (
                <label key={v} style={{ ...radioLabel, fontSize: 13 }}>
                  <input type="radio" name="internalPlanCycle" value={v}
                    checked={form.s7_internalPlanCycle === v}
                    onChange={() => set({ s7_internalPlanCycle: v })} />
                  {l}
                  {warn && form.s7_internalPlanCycle === v && <WarnBadge text="갱신 권고" />}
                </label>
              ))}
            </div>
          </div>
        )}
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
        {form.s7_encryption === '일부만 암호화' && (
          <div style={{ ...subIndent, marginTop: 10 }}>
            <label style={labelStyle}>암호화 적용 항목</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['비밀번호 (해시 처리)', '주민등록번호', '신용카드번호·계좌번호', '운전면허·외국인등록·여권번호', '생체인식정보', '일반 회원정보 (이름·연락처 등)', '암호화 항목 없음'].map(v => {
                const isMandatory = ['비밀번호 (해시 처리)', '주민등록번호', '신용카드번호·계좌번호'].includes(v);
                return (
                  <label key={v} style={checkLabel}>
                    <input type="checkbox" checked={form.s7_b03_items.includes(v)}
                      onChange={() => set({ s7_b03_items: toggle(form.s7_b03_items, v) })} />
                    {v}
                    {isMandatory && !form.s7_b03_items.includes(v) && <WarnBadge text="필수 암호화" />}
                    {v === '암호화 항목 없음' && form.s7_b03_items.includes(v) && <WarnBadge text="위반" />}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {(form.s6_system === '보유함 (CRM, ERP, 회원관리 시스템 등)') && (
        <div style={fieldWrap}>
          <label style={labelStyle}>직원별 접근 권한 분리 여부</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            {['직원별로 권한이 분리되어 있음', '일부만 분리', '분리되어 있지 않음 (공용 계정)', '모르겠음'].map(v => (
              <label key={v} style={radioLabel}>
                <input type="radio" name="b04Access" value={v}
                  checked={form.s7_b04_access === v}
                  onChange={() => set({ s7_b04_access: v })} />
                {v}
                {v === '분리되어 있지 않음 (공용 계정)' && form.s7_b04_access === v && <WarnBadge text="위반" />}
                {v === '일부만 분리' && form.s7_b04_access === v && <WarnBadge text="전면 분리 권장" />}
              </label>
            ))}
          </div>

          <label style={labelStyle}>퇴직자 접근 권한 즉시 회수 여부</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            {['퇴직 즉시 회수', '일정 기간 후 회수', '회수하지 않음', '모르겠음'].map(v => (
              <label key={v} style={radioLabel}>
                <input type="radio" name="b04Retired" value={v}
                  checked={form.s7_b04_retired === v}
                  onChange={() => set({ s7_b04_retired: v })} />
                {v}
                {v === '회수하지 않음' && form.s7_b04_retired === v && <WarnBadge text="위반" />}
              </label>
            ))}
          </div>

          <label style={labelStyle}>접근 권한 부여·변경·말소 내역 보관 여부</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            {['내역을 기록하고 3년간 보관', '기록하지만 3년 미만 보관', '기록하지 않음', '모르겠음'].map(v => (
              <label key={v} style={radioLabel}>
                <input type="radio" name="b04History" value={v}
                  checked={form.s7_b04_history === v}
                  onChange={() => set({ s7_b04_history: v })} />
                {v}
                {v === '기록하지 않음' && form.s7_b04_history === v && <WarnBadge text="위반" />}
              </label>
            ))}
          </div>

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
          <div style={{ ...fieldWrap }}>
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
                <div key={v}>
                  <label style={radioLabel}>
                    <input type="radio" name="marketingConsent" value={v}
                      checked={form.s8_consent === v}
                      onChange={() => set({ s8_consent: v, s8_consentTiming: '' })} />
                    {l}
                    {warn && form.s8_consent === v && <WarnBadge text="위반 가능성 높음" />}
                    {ok && form.s8_consent === v && (
                      <span style={{ fontSize: 11, color: '#15803D', fontWeight: 600, marginLeft: 8 }}>✓ 적법</span>
                    )}
                  </label>
                  {v === 'separate' && form.s8_consent === 'separate' && (
                    <div style={{ ...subIndent, marginTop: 6 }}>
                      <label style={{ ...labelStyle, fontSize: 12 }}>동의 받는 시점은?</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[
                          { v: 'separate_proc', l: '회원가입과 별도 절차로 받음' },
                          { v: 'before_send', l: '마케팅 발송 직전 매번 받음' },
                          { v: 'written', l: '동의서 별도 작성·서명' },
                          { v: 'other', l: '기타' },
                        ].map(({ v: tv, l: tl }) => (
                          <label key={tv} style={{ ...radioLabel, fontSize: 13 }}>
                            <input type="radio" name="consentTiming" value={tv}
                              checked={form.s8_consentTiming === tv}
                              onChange={() => set({ s8_consentTiming: tv })} />
                            {tl}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 0 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              야간 발송 여부
              <span style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 400 }}>정통망법 제50조의5</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { v: 'yes', l: '야간 (21시 ~ 익일 8시)에도 발송함', warn: true },
                { v: 'no', l: '야간 발송 안 함' },
                { v: 'unknown', l: '모르겠음' },
              ].map(({ v, l, warn }) => (
                <label key={v} style={radioLabel}>
                  <input type="radio" name="nightSend" value={v}
                    checked={form.s8_nightSend === v}
                    onChange={() => set({ s8_nightSend: v })} />
                  {l}
                  {warn && form.s8_nightSend === v && <WarnBadge text="별도 야간 동의 필요" />}
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

  // ── 요약 뷰 ──────────────────────────────────────────────────────────────────
  const renderSummary = () => {
    const contractSummary = form.s5_delegatees.map(d => {
      const state = form.s5_contractPerType[d];
      const label = CONTRACT_OPTIONS.find(o => o.v === state)?.l ?? '미설정';
      return `${d}: ${label}`;
    });

    const allDataItems = [
      ...form.s4_general.filter(x => x !== '기타'),
      ...(form.s4_general.includes('기타') && form.s4_generalOther ? [form.s4_generalOther] : []),
      ...form.s4_uniqueId,
      ...form.s4_sensitive,
      ...form.s4_credit,
      ...form.s4_location,
    ];

    return (
      <div>
        <SummaryCard title="기본정보" stepIdx={0} onEdit={handleEditFromSummary} hasData={!!form.s1_companyName}>
          <SummaryField label="회사명" value={form.s1_companyName} />
          <SummaryField label="법인구분" value={form.s1_entityType} />
          <SummaryField label="설립연도" value={form.s1_foundingYear} />
          <SummaryField label="소재지" value={form.s1_address} />
        </SummaryCard>

        <SummaryCard title="사업자 규모" stepIdx={1} onEdit={handleEditFromSummary} hasData={!!form.s3_industry}>
          <SummaryField label="업종" value={form.s3_industryDetail || form.s3_industry} />
          <SummaryField label="직원 수" value={form.s3_employees ? `${form.s3_employees}명 (${getCompanySize(form.s3_employees)})` : null} />
          <SummaryField label="매출액" value={form.s3_revenue} />
        </SummaryCard>

        <SummaryCard title="개인정보 처리 현황" stepIdx={2} onEdit={handleEditFromSummary} hasData={!!form.s4_subjectRange}>
          <SummaryField label="정보주체 규모" value={form.s4_subjectRange} />
          <SummaryField label="수집 정보 유형" value={allDataItems.length > 0 ? allDataItems : null} />
          <SummaryField label="수집 방법" value={form.s4_methods} />
          <SummaryField label="이용 목적" value={form.s4_purposes} />
        </SummaryCard>

        <SummaryCard title="처리 위탁·제공 현황" stepIdx={3} onEdit={handleEditFromSummary} hasData={!!form.s5_delegation}>
          <SummaryField label="위탁 여부"
            value={form.s5_delegation === 'yes' ? '위탁함' : form.s5_delegation === 'no' ? '위탁 안 함' : form.s5_delegation === 'unknown' ? '잘 모르겠음' : null} />
          {contractSummary.length > 0 && <SummaryField label="수탁자별 계약 현황" value={contractSummary} />}
          <SummaryField label="제3자 제공"
            value={form.s5_provision === 'yes' ? `제공함${form.s5_provisionPurpose ? ` — ${form.s5_provisionPurpose}` : ''}` : form.s5_provision === 'no' ? '제공 안 함' : form.s5_provision === 'unknown' ? '잘 모르겠음' : null} />
          <SummaryField label="국외 이전"
            value={form.s5_overseas === 'yes' ? `이전됨${form.s5_overseasCountry ? ` (${form.s5_overseasCountry})` : ''}` : form.s5_overseas === 'no' ? '이전 안 됨' : form.s5_overseas === 'unknown' ? '잘 모르겠음' : null} />
        </SummaryCard>

        <SummaryCard title="처리 환경" stepIdx={4} onEdit={handleEditFromSummary} hasData={form.s6_channels.length > 0}>
          <SummaryField label="운영 채널" value={form.s6_channels} />
          <SummaryField label="CCTV"
            value={form.s6_cctv === 'yes' ? `운영함${form.s6_cctvLoc.length > 0 ? ` (${form.s6_cctvLoc.join(', ')})` : ''}` : form.s6_cctv === 'no' ? '운영 안 함' : null} />
          <SummaryField label="처리시스템" value={form.s6_system} />
        </SummaryCard>

        <SummaryCard title="안전조치 현황" stepIdx={5} onEdit={handleEditFromSummary} hasData={!!form.s7_policy}>
          <SummaryField label="처리방침 게시"
            value={form.s7_policy === 'yes' ? '게시함' : form.s7_policy === 'no' ? '게시 안 함' : form.s7_policy === 'unknown' ? '모르겠음' : null} />
          <SummaryField label="CPO 지정"
            value={form.s7_cpo === 'yes' ? `지정함${form.s7_cpoTitle ? ` (${form.s7_cpoTitle})` : ''}` : form.s7_cpo === 'no' ? '지정 안 함' : form.s7_cpo === 'unknown' ? '모르겠음' : null} />
          <SummaryField label="내부관리계획"
            value={form.s7_internalPlan === 'yes' ? '수립함' : form.s7_internalPlan === 'no' ? '수립 안 함' : form.s7_internalPlan === 'unknown' ? '모르겠음' : null} />
          <SummaryField label="암호화" value={form.s7_encryption} />
        </SummaryCard>

        <SummaryCard title="마케팅·광고 활용" stepIdx={6} onEdit={handleEditFromSummary} hasData={!!form.s8_marketing}>
          <SummaryField label="마케팅 발송"
            value={form.s8_marketing === 'yes' ? '발송함' : form.s8_marketing === 'no' ? '발송 안 함' : null} />
          {form.s8_marketing === 'yes' && <SummaryField label="발송 채널" value={form.s8_channels} />}
        </SummaryCard>

        <SummaryCard title="성장 시나리오" stepIdx={7} onEdit={handleEditFromSummary} hasData={form.s9_plans.length > 0}>
          <SummaryField label="성장 계획" value={form.s9_plans.map(v => ({
            hire: '직원 채용 예정', revenue: '매출 성장 예정', subjects: '정보주체 수 증가 예정',
            newbiz: '신규 사업 진출 예정', overseas: '해외 진출 예정', ai: 'AI·신기술 도입 예정', none: '변화 없음',
          }[v] ?? v))} />
        </SummaryCard>
      </div>
    );
  };

  // ── 섹션 렌더 맵 ─────────────────────────────────────────────────────────────
  const sectionRenderers = [
    renderS1, renderS3, renderS4, renderS5,
    renderS6, renderS7, renderS8, renderS9,
  ];

  const progress = ((step + 1) / SECTIONS.length) * 100;
  const lastStep = SECTIONS.length - 1;

  return (
    <div style={{ padding: '32px 32px 40px', maxWidth: 720, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>

      {/* 온보딩 모달 */}
      {showOnboardingModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '40px 36px',
            maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--bg-tint-blue)', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gok-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 12, lineHeight: 1.4, letterSpacing: '-0.02em' }}>
              기업 정보를 입력하면<br />더 정확한 리스크 진단이 가능해요
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6, marginBottom: 28 }}>
              업종, 직원 수, 수집 개인정보 항목 등을 등록하면<br />
              AI가 실제 법적 리스크를 맞춤 진단해 드려요.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleOnboardingStart} style={{
                width: '100%', padding: '13px', borderRadius: 12,
                background: 'var(--gok-blue)', color: 'white',
                border: 'none', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                letterSpacing: '-0.01em',
              }}>지금 입력하기</button>
              <button onClick={() => { setShowOnboardingModal(false); router.push('/chat?mode=profile'); }} style={{
                width: '100%', padding: '13px', borderRadius: 12,
                background: 'var(--bg-tint-blue)', color: 'var(--gok-blue)',
                border: '1px solid var(--gok-blue)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                letterSpacing: '-0.01em',
              }}>AI와 대화로 작성하기</button>
              <button onClick={handleOnboardingSkip} style={{
                width: '100%', padding: '13px', borderRadius: 12,
                background: 'transparent', color: 'var(--fg-3)',
                border: '1px solid var(--border-default)', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>나중에 하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 온보딩 배너 (모달 이후 재방문 시) */}
      {showOnboardingBanner && !form.s1_companyName && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '12px 16px', marginBottom: 20,
          background: 'var(--bg-tint-blue)', border: '1px solid var(--gok-blue)',
          borderRadius: 12, borderLeftWidth: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gok-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            <span style={{ fontSize: 13, color: 'var(--gok-blue)', fontWeight: 500 }}>
              기업 정보를 입력하면 더 정확한 리스크 진단이 가능해요.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={() => router.push('/chat?mode=profile')} style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'var(--bg-tint-blue)', color: 'var(--gok-blue)',
              border: '1px solid var(--gok-blue)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' as const,
            }}>AI와 작성하기</button>
            <button onClick={handleOnboardingStart} style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'var(--gok-blue)', color: 'white',
              border: 'none', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' as const,
            }}>직접 입력하기</button>
            <button onClick={() => setShowOnboardingBanner(false)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--fg-3)', padding: 4, display: 'flex', alignItems: 'center',
            }} title="닫기">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em' }}>마이페이지</div>
          <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 3 }}>
            기업 프로필을 정확히 등록하면 AI 진단 정확도가 높아져요.
          </div>
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'summary' ? 'form' : 'summary')}
          style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: '1px solid var(--border-default)',
            background: viewMode === 'summary' ? 'var(--gok-blue)' : 'white',
            color: viewMode === 'summary' ? 'white' : 'var(--fg-2)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {viewMode === 'summary' ? '편집 모드' : '전체 보기'}
        </button>
      </div>

      {viewMode === 'summary' ? (
        renderSummary()
      ) : (
        <>
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
                  fontFamily: 'var(--font-body)',
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

            {step < lastStep ? (
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
        </>
      )}
    </div>
  );
}
