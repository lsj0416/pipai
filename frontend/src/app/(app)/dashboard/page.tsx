'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/dashboard/Dashboard';
import type { ChecklistRow, GrowthScenario, DashboardSummary, SeverityActive } from '@/lib/types';
import { getSummary, resolveRisk, getGrowthScenarios, type RiskLevel } from '@/lib/api/dashboard';

const LEVEL_MAP: Record<RiskLevel, ChecklistRow['severity']> = {
  IMMEDIATE: 'high',
  CHECK_NEEDED: 'medium',
  GOOD: 'safe',
};

const FALLBACK_GROWTH: GrowthScenario[] = [
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
  const [rows, setRows] = useState<ChecklistRow[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({ high: 0, medium: 0, safe: 0 });
  const [growth, setGrowth] = useState<GrowthScenario[]>(FALLBACK_GROWTH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }

    try {
      const [resSummary, resGrowth] = await Promise.all([
        getSummary(token),
        getGrowthScenarios(token),
      ]);

      if (!resSummary.success || !resSummary.data) {
        setError('데이터를 불러오는 중 오류가 발생했어요.');
        return;
      }

      const { riskCounts, recentItems } = resSummary.data;
      setSummary({
        high:   Number(riskCounts['IMMEDIATE']   ?? 0),
        medium: Number(riskCounts['CHECK_NEEDED'] ?? 0),
        safe:   Number(riskCounts['GOOD']         ?? 0),
      });
      setRows(recentItems.map(item => ({
        id:       item.id,
        title:    item.title,
        severity: LEVEL_MAP[item.level] ?? 'safe',
        law:      item.relatedLaw ?? '',
        done:     item.resolved,
      })));

      if (resGrowth.success && resGrowth.data) {
        setGrowth(resGrowth.data.map(s => ({
          id: s.id,
          label: s.label,
          rows: s.rows.map(r => ({
            title: r.title,
            law: r.law,
            severity: (r.severity as SeverityActive) ?? 'safe',
            applies: r.applies,
          })),
        })));
      }
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const init = () => {
      localStorage.removeItem('dashboardNeedsRefresh');
      void loadData();
    };
    init();
  }, [loadData]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' &&
          localStorage.getItem('dashboardNeedsRefresh') === 'true') {
        localStorage.removeItem('dashboardNeedsRefresh');
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadData]);

  const handleResolve = async (itemId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const res = await resolveRisk(token, itemId);
    if (!res.success) return;

    setRows(prev => prev.map(r => r.id === itemId ? { ...r, done: true } : r));
    setSummary(prev => {
      const row = rows.find(r => r.id === itemId);
      if (!row || row.done) return prev;
      const key = row.severity === 'high' ? 'high' : row.severity === 'medium' ? 'medium' : 'safe';
      return { ...prev, [key]: Math.max(0, prev[key] - 1) };
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--fg-3)', fontSize: 14 }}>
        불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', maxWidth: 480 }}>
        <div style={{ background: '#FEF2F2', color: 'var(--gok-red)', padding: '16px 20px', borderRadius: 12, fontSize: 14 }}>
          {error}
          <button onClick={loadData} style={{ display: 'block', marginTop: 10, fontSize: 13, color: 'var(--gok-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      rows={rows}
      summary={summary}
      growth={growth}
      onJumpToChat={() => router.push('/chat')}
      onResolve={handleResolve}
    />
  );
}
