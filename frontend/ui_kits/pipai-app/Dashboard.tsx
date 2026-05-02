// Dashboard.tsx — 리스크 대시보드: summary cards + checklist table + growth scenarios tab
const { useState: useStateDash } = React;

interface SeverityColorMap {
  bg: string;
  border: string;
  accent: string;
  text: string;
}

interface SummaryCardProps {
  label: string;
  count: number;
  severity: SeverityActive;
  active: boolean;
  onClick: () => void;
}

interface SeverityPillProps {
  severity: SeverityActive;
}

interface SeverityPillStyle {
  bg: string;
  label: string;
}

interface ChecklistTableProps {
  rows: ChecklistRow[];
  onRowClick: (row: ChecklistRow) => void;
}

interface GrowthTabsProps {
  scenarios: GrowthScenario[];
  active: string;
  onChange: (id: string) => void;
}

interface GrowthRowProps {
  row: GrowthRowData;
}

interface DashboardProps {
  rows: ChecklistRow[];
  summary: DashboardSummary;
  growth: GrowthScenario[];
  onJumpToChat: (row: ChecklistRow) => void;
}

function SummaryCard({ label, count, severity, active, onClick }: SummaryCardProps): React.ReactElement {
  const map: Record<SeverityActive, SeverityColorMap> = {
    high:   { bg: '#FFF1F4', border: '#F8C9D2', accent: '#E4032E', text: '#9D0220' },
    medium: { bg: '#FFF6E6', border: '#F4DFA9', accent: '#E89B0F', text: '#7C5009' },
    safe:   { bg: '#EEF3F8', border: '#CADAEB', accent: '#3F6E9A', text: '#003764' },
  };
  const m = map[severity];
  return (
    <button onClick={onClick} style={{
      flex: 1, textAlign: 'left',
      background: m.bg,
      border: `1px solid ${active ? m.accent : m.border}`,
      outline: active ? `2px solid ${m.accent}` : 'none',
      outlineOffset: -1,
      borderRadius: 14, padding: '20px 22px',
      fontFamily: 'var(--font-body)', cursor: 'pointer',
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

function SeverityPill({ severity }: SeverityPillProps): React.ReactElement {
  const map: Record<SeverityActive, SeverityPillStyle> = {
    high:   { bg: '#E4032E', label: '위험' },
    medium: { bg: '#E89B0F', label: '확인필요' },
    safe:   { bg: '#3F6E9A', label: '양호' },
  };
  const m = map[severity];
  return (
    <span style={{ background: m.bg, color: 'white', fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
}

function ChecklistTable({ rows, onRowClick }: ChecklistTableProps): React.ReactElement {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border-subtle)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1.6fr 1fr',
        gap: 16, padding: '12px 22px',
        background: 'var(--bg-subtle)',
        fontSize: 11, fontWeight: 600, color: 'var(--fg-3)',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div>항목명</div><div>리스크 등급</div><div>관련 법령</div><div>조치 여부</div>
      </div>
      {rows.map((r: ChecklistRow, i: number) => (
        <button key={i} onClick={() => onRowClick(r)} style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1.6fr 1fr',
          gap: 16, padding: '14px 22px',
          width: '100%', textAlign: 'left', background: 'white',
          border: 'none', borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          fontFamily: 'var(--font-body)', cursor: 'pointer', alignItems: 'center',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'white'; }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>{r.title}</div>
          <div><SeverityPill severity={r.severity} /></div>
          <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{r.law}</div>
          <div style={{ fontSize: 13, color: r.done ? 'var(--success)' : 'var(--fg-3)', fontWeight: r.done ? 600 : 500 }}>
            {r.done ? '완료' : '미조치'}
          </div>
        </button>
      ))}
    </div>
  );
}

function GrowthTabs({ scenarios, active, onChange }: GrowthTabsProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border-subtle)', marginBottom: 16 }}>
      {scenarios.map((s: GrowthScenario) => {
        const isActive = s.id === active;
        return (
          <button key={s.id} onClick={() => onChange(s.id)} style={{
            background: 'transparent', border: 'none',
            padding: '10px 14px',
            fontSize: 14, fontFamily: 'var(--font-body)',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? 'var(--gok-blue)' : 'var(--fg-3)',
            borderBottom: isActive ? '2px solid var(--gok-blue)' : '2px solid transparent',
            marginBottom: -1, cursor: 'pointer', letterSpacing: '-0.01em',
          }}>{s.label}</button>
        );
      })}
    </div>
  );
}

function GrowthRow({ row }: GrowthRowProps): React.ReactElement {
  const dim = !row.applies;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      background: dim ? 'transparent' : 'white',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10, opacity: dim ? 0.5 : 1,
    }}>
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

function Dashboard({ rows, summary, growth, onJumpToChat }: DashboardProps): React.ReactElement {
  const [tab, setTab] = useStateDash<string>(growth[0]?.id ?? '');
  const [filter, setFilter] = useStateDash<SeverityActive | null>(null);

  const tabRows: GrowthRowData[] = growth.find((g: GrowthScenario) => g.id === tab)?.rows ?? [];
  const filteredRows: ChecklistRow[] = filter != null ? rows.filter((r: ChecklistRow) => r.severity === filter) : rows;
  const filterLabel: Record<SeverityActive, string> = { high: '즉시 조치 필요', medium: '확인 필요', safe: '양호' };

  const toggleFilter = (sev: SeverityActive): void => {
    setFilter(filter === sev ? null : sev);
  };

  return (
    <div style={{ padding: '24px 32px 48px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em' }}>리스크 대시보드</div>
        <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4 }}>대화에서 진단된 항목이 자동으로 정리돼요.</div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        <SummaryCard label="즉시 조치 필요" count={summary.high}   severity="high"   active={filter === 'high'}   onClick={() => toggleFilter('high')} />
        <SummaryCard label="확인 필요"      count={summary.medium} severity="medium" active={filter === 'medium'} onClick={() => toggleFilter('medium')} />
        <SummaryCard label="양호"           count={summary.safe}   severity="safe"   active={filter === 'safe'}   onClick={() => toggleFilter('safe')} />
      </div>

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
        <ChecklistTable rows={filteredRows} onRowClick={onJumpToChat} />
      </div>

      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em', marginBottom: 12 }}>성장 시나리오</div>
        <GrowthTabs scenarios={growth} active={tab} onChange={setTab} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tabRows.map((r: GrowthRowData, i: number) => <GrowthRow key={i} row={r} />)}
        </div>
      </div>
    </div>
  );
}

(window as any).Dashboard = Dashboard;
