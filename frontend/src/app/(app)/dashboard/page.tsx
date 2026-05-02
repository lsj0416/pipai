'use client';

import { useRouter } from 'next/navigation';
import Dashboard from '@/components/dashboard/Dashboard';
import type { ChecklistRow, GrowthScenario, DashboardSummary } from '@/lib/types';

// TODO: 실제 구현 시 lib/api/dashboard.ts getDashboard()로 교체
const MOCK_SUMMARY: DashboardSummary = { high: 2, medium: 4, safe: 5 };

const MOCK_ROWS: ChecklistRow[] = [
  { title: '수집 동의 절차',   severity: 'high',   law: '개인정보보호법 제15조', done: false },
  { title: '유출 신고 절차',   severity: 'high',   law: '개인정보보호법 제34조', done: false },
  { title: 'CCTV 사전 고지',   severity: 'medium', law: '개인정보보호법 제25조', done: false },
  { title: '처리방침 공개',    severity: 'medium', law: '개인정보보호법 제30조', done: false },
  { title: '파기 절차',        severity: 'medium', law: '개인정보보호법 제21조', done: false },
  { title: '안전성 확보 조치', severity: 'medium', law: '개인정보보호법 제29조', done: true  },
  { title: '보관 기간 설정',   severity: 'safe',   law: '개인정보보호법 제21조', done: true  },
  { title: '수집 최소화',      severity: 'safe',   law: '개인정보보호법 제16조', done: true  },
  { title: '제3자 제공 동의',  severity: 'safe',   law: '개인정보보호법 제17조', done: true  },
];

const MOCK_GROWTH: GrowthScenario[] = [
  {
    id: 'emp10', label: '직원 10명 초과 시',
    rows: [
      { title: '개인정보보호책임자(CPO) 지정', law: '개인정보보호법 제31조', severity: 'medium', applies: true },
      { title: '내부관리계획 수립',           law: '개인정보보호법 제29조', severity: 'medium', applies: true },
      { title: '개인정보 영향평가',           law: '개인정보보호법 제33조', severity: 'safe',   applies: false },
    ],
  },
  {
    id: 'rev1b', label: '매출 10억 초과 시',
    rows: [
      { title: '개인정보보호 인증(ISMS-P) 검토', law: '정보통신망법 제47조의3', severity: 'medium', applies: true },
      { title: '연 1회 이상 임직원 교육',       law: '개인정보보호법 제28조',  severity: 'medium', applies: true },
    ],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  return (
    <Dashboard
      rows={MOCK_ROWS}
      summary={MOCK_SUMMARY}
      growth={MOCK_GROWTH}
      onJumpToChat={() => router.push('/chat')}
    />
  );
}
