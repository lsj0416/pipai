import type { RiskItemData, Severity } from '@/lib/types';

interface SeverityStyle {
  bg: string;
  char: string;
  color: string;
}

const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
  high:    { bg: 'var(--gok-red)',  char: '!', color: 'white' },
  medium:  { bg: '#B7791F',         char: '·', color: 'white' },
  safe:    { bg: '#1E8E3E',         char: '✓', color: 'white' },
  pending: { bg: 'var(--gray-300)', char: '',  color: 'white' },
  exempt:  { bg: 'var(--gray-300)', char: '○', color: '#6B7280' },
};

function SeverityMarker({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLES[severity];
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: s.color, fontSize: 11, fontWeight: 700, background: s.bg, marginTop: 2,
    }}>{s.char}</div>
  );
}

function RiskItem({ item, justChanged }: { item: RiskItemData; justChanged: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '11px 12px', borderRadius: 10,
      background: justChanged ? 'var(--bg-tint-blue)' : 'white',
      border: '1px solid var(--border-subtle)',
      transition: 'background 600ms var(--ease-out)',
    }}>
      <SeverityMarker severity={item.severity} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: '-0.01em', lineHeight: 1.4 }}>{item.title}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{item.meta}</div>
      </div>
    </div>
  );
}

function RiskGroup({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, fontWeight: 600, color: 'var(--fg-3)',
        letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0 4px 8px',
      }}>
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

interface RiskPanelProps {
  items: RiskItemData[];
  recentlyChangedId?: string;
}

export default function RiskPanel({ items, recentlyChangedId }: RiskPanelProps) {
  const high    = items.filter(i => i.severity === 'high');
  const med     = items.filter(i => i.severity === 'medium');
  const safe    = items.filter(i => i.severity === 'safe');
  const pending = items.filter(i => i.severity === 'pending');

  return (
    <aside style={{
      width: 320, flexShrink: 0,
      background: 'var(--bg-canvas)',
      borderLeft: '1px solid var(--border-default)',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          실시간 위험 체크리스트
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '-0.015em', marginTop: 4 }}>
          리스크 현황
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
        {high.length > 0 && (
          <RiskGroup label="즉시 조치" count={high.length}>
            {high.map(i => <RiskItem key={i.id} item={i} justChanged={i.id === recentlyChangedId} />)}
          </RiskGroup>
        )}
        {med.length > 0 && (
          <RiskGroup label="주의" count={med.length}>
            {med.map(i => <RiskItem key={i.id} item={i} justChanged={i.id === recentlyChangedId} />)}
          </RiskGroup>
        )}
        {safe.length > 0 && (
          <RiskGroup label="해결됨" count={safe.length}>
            {safe.map(i => <RiskItem key={i.id} item={i} justChanged={i.id === recentlyChangedId} />)}
          </RiskGroup>
        )}
        {pending.length > 0 && (
          <RiskGroup label="미점검" count={pending.length}>
            {pending.map(i => <RiskItem key={i.id} item={i} justChanged={false} />)}
          </RiskGroup>
        )}
        {items.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--fg-3)', textAlign: 'center', marginTop: 32 }}>
            대화를 시작하면 리스크 항목이 여기에 표시됩니다.
          </div>
        )}
      </div>
    </aside>
  );
}
