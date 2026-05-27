'use client';

import { useState } from 'react';
import type { ChecklistRow, GrowthScenario, GrowthRowData, DashboardSummary, SeverityActive } from '@/lib/types';

interface DashboardProps {
  rows: ChecklistRow[];
  summary: DashboardSummary;
  growth: GrowthScenario[];
  profileReady: boolean;
  onJumpToChat: (row: ChecklistRow) => void;
  onResolve?: (itemId: string) => void;
}

function formatResolvedAt(iso: string): string {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${hh}:${mm}`;
}

interface ColorMap { bg: string; border: string; accent: string; text: string }
const SUMMARY_COLORS: Record<SeverityActive, ColorMap> = {
  high:   { bg: '#FFF1F4', border: '#F8C9D2', accent: '#E4032E', text: '#9D0220' },
  medium: { bg: '#FFF6E6', border: '#F4DFA9', accent: '#E89B0F', text: '#7C5009' },
  safe:   { bg: '#EEF3F8', border: '#CADAEB', accent: '#3F6E9A', text: '#003764' },
};

function SeverityPill({ severity }: { severity: SeverityActive }) {
  const MAP: Record<SeverityActive, { bg: string; label: string }> = {
    high:   { bg: '#E4032E', label: '위험' },
    medium: { bg: '#E89B0F', label: '확인필요' },
    safe:   { bg: '#3F6E9A', label: '양호' },
  };
  const m = MAP[severity];
  return <span style={{ background: m.bg, color: 'white', fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>{m.label}</span>;
}

function SummaryCard({ label, count, severity, active, onClick }: { label: string; count: number; severity: SeverityActive; active: boolean; onClick: () => void }) {
  const m = SUMMARY_COLORS[severity];
  return (
    <button onClick={onClick} style={{
      flex: 1, textAlign: 'left',
      background: m.bg, border: `1px solid ${active ? m.accent : m.border}`,
      outline: active ? `2px solid ${m.accent}` : 'none', outlineOffset: -1,
      borderRadius: 14, padding: '20px 22px', fontFamily: 'var(--font-body)', cursor: 'pointer',
      transition: 'transform 120ms var(--ease-out), box-shadow 120ms var(--ease-out)',
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.accent }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: m.text, letterSpacing: '-0.01em' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 12 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 800, color: m.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{count}</span>
        <span style={{ fontSize: 14, color: m.text, fontWeight: 600 }}>건</span>
      </div>
    </button>
  );
}

function GrowthRow({ row }: { row: GrowthRowData }) {
  const dim = !row.applies;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: dim ? 'transparent' : 'white', border: '1px solid var(--border-subtle)', borderRadius: 10, opacity: dim ? 0.5 : 1 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>{row.title}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{row.law}</div>
      </div>
      {row.applies
        ? <SeverityPill severity={row.severity} />
        : <span style={{ fontSize: 11, color: 'var(--fg-4)', fontWeight: 500, whiteSpace: 'nowrap' }}>해당 없음</span>}
    </div>
  );
}

export default function Dashboard({ rows, summary, growth, profileReady, onJumpToChat, onResolve }: DashboardProps) {
  const [tab, setTab] = useState<string>(growth[0]?.id ?? '');
  const [filter, setFilter] = useState<SeverityActive | null>(null);

  const tabRows: GrowthRowData[] = growth.find(g => g.id === tab)?.rows ?? [];
  const filteredRows = filter != null ? rows.filter(r => r.severity === filter) : rows;
  const filterLabel: Record<SeverityActive, string> = { high: '즉시 조치 필요', medium: '확인 필요', safe: '양호' };

  return (
    <div style={{ padding: '24px 32px 48px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em' }}>리스크 대시보드</div>
        <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4 }}>마이페이지 + 대화에서 진단된 항목이 자동으로 정리돼요.</div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        <SummaryCard label="즉시 조치 필요" count={summary.high}   severity="high"   active={filter === 'high'}   onClick={() => setFilter(filter === 'high' ? null : 'high')} />
        <SummaryCard label="확인 필요"      count={summary.medium} severity="medium" active={filter === 'medium'} onClick={() => setFilter(filter === 'medium' ? null : 'medium')} />
        <SummaryCard label="양호"           count={summary.safe}   severity="safe"   active={filter === 'safe'}   onClick={() => setFilter(filter === 'safe' ? null : 'safe')} />
      </div>

      {/* 체크리스트 */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em' }}>현재 리스크 체크리스트</span>
          {filter != null ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-2)', background: 'var(--bg-tint-blue)', borderRadius: 999, padding: '3px 10px', fontWeight: 600 }}>
              {filterLabel[filter]} · {filteredRows.length}건
              <button onClick={() => setFilter(null)} style={{ background: 'transparent', border: 'none', color: 'var(--fg-2)', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1, fontWeight: 700 }}>×</button>
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>· 행을 클릭하면 관련 대화로 이동해요</span>
          )}
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.6fr 1fr', gap: 16, padding: '12px 22px', background: 'var(--bg-subtle)', fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>항목명</div><div>리스크 등급</div><div>관련 법령</div><div>조치 여부</div>
          </div>
          {filteredRows.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--fg-3)', fontSize: 14 }}>
              {rows.length === 0
                ? (profileReady ? '현재 확인된 리스크가 없어요.' : '마이페이지 등록 후 진단이 시작됩니다')
                : '해당 등급의 항목이 없어요.'}
            </div>
          )}
          {filteredRows.map((r, i) => (
            <div key={i} onClick={() => onJumpToChat(r)}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1.6fr 1fr',
                gap: 16, padding: '14px 22px', width: '100%', textAlign: 'left', background: 'white',
                borderBottom: i < filteredRows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                fontFamily: 'var(--font-body)', cursor: 'pointer', alignItems: 'center',
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'white'; }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>{r.title}</div>
              <div><SeverityPill severity={r.severity} /></div>
              <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{r.law}</div>
              <div>
                {r.done ? (
                  <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                    완료{r.resolvedAt ? ` · ${formatResolvedAt(r.resolvedAt)}` : ''}
                  </span>
                ) : (
                  <button onClick={e => { e.stopPropagation(); if (r.id && onResolve) onResolve(r.id); }} style={{
                    background: 'var(--bg-tint-blue)', color: 'var(--gok-blue)',
                    border: '1px solid var(--border-subtle)', borderRadius: 6,
                    padding: '4px 10px', fontSize: 12, fontWeight: 600,
                    cursor: onResolve && r.id ? 'pointer' : 'default',
                    fontFamily: 'var(--font-body)',
                  }}>완료 처리</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 성장 시나리오 */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em', marginBottom: 12 }}>성장 시나리오</div>
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border-subtle)', marginBottom: 16 }}>
          {growth.map(s => {
            const isActive = s.id === tab;
            return (
              <button key={s.id} onClick={() => setTab(s.id)} style={{
                background: 'transparent', border: 'none', padding: '10px 14px',
                fontSize: 14, fontFamily: 'var(--font-body)',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--gok-blue)' : 'var(--fg-3)',
                borderBottom: isActive ? '2px solid var(--gok-blue)' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer', letterSpacing: '-0.01em',
              }}>{s.label}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tabRows.map((r, i) => <GrowthRow key={i} row={r} />)}
        </div>
      </div>
    </div>
  );
}
