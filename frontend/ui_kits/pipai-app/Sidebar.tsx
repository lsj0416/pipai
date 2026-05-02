// Sidebar.tsx — left navigation matching the v2 reference

interface NewChatButtonProps {
  onClick: () => void;
}

interface NavIconProps {
  name: NavId;
}

interface NavItemProps {
  icon: NavId;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface RiskMiniProps {
  items: RiskMiniItem[];
}

interface UserChipProps {
  name: string;
  business: UserBusiness;
}

interface SectionLabelProps {
  children: React.ReactNode;
}

interface SidebarProps {
  activeNav: NavId;
  onNav: (id: NavId) => void;
  riskItems: RiskMiniItem[];
  user: UserData;
}

interface SevPillStyle {
  bg: string;
  color: string;
  label: string;
}

function SidebarLogo(): React.ReactElement {
  return (
    <div style={{ padding: '22px 22px 6px' }}>
      <img src="../../assets/logo-mono-white.svg" style={{ height: 38 }} alt="PIPAi" />
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8, letterSpacing: '-0.01em' }}>개인정보보호 AI 컨설팅</div>
    </div>
  );
}

function NewChatButton({ onClick }: NewChatButtonProps): React.ReactElement {
  return (
    <button onClick={onClick} style={{
      margin: '18px 16px 8px',
      padding: '10px 14px',
      width: 'calc(100% - 32px)',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.2)',
      background: 'transparent',
      color: 'white',
      fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
        <path d="M12 5v14M5 12h14"/>
      </svg>
      <span style={{ whiteSpace: 'nowrap' }}>새 대화 시작</span>
    </button>
  );
}

function NavIcon({ name }: NavIconProps): React.ReactElement | null {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, style: { flexShrink: 0 } };
  if (name === 'chat')    return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  if (name === 'dash')    return <svg {...common}><path d="M3 3v18h18"/><path d="M7 16l4-6 4 3 5-8"/></svg>;
  if (name === 'me')      return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>;
  if (name === 'inquiry') return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>;
  return null;
}

function NavItem({ icon, label, active, onClick }: NavItemProps): React.ReactElement {
  return (
    <button onClick={onClick} style={{
      width: 'calc(100% - 16px)',
      margin: '0 8px',
      textAlign: 'left',
      padding: '10px 14px',
      borderRadius: 10,
      border: 'none',
      background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
      color: 'white',
      fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 10,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ display: 'inline-flex', opacity: 0.95, flexShrink: 0 }}><NavIcon name={icon} /></span>
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

function RiskMini({ items }: RiskMiniProps): React.ReactElement {
  const sevPill: Record<SeverityActive, SevPillStyle> = {
    high:   { bg: '#E4032E', color: 'white', label: '위험' },
    medium: { bg: '#E89B0F', color: 'white', label: '확인필요' },
    safe:   { bg: '#3F6E9A', color: 'white', label: '양호' },
  };
  return (
    <div style={{
      margin: '14px 16px 0',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 10, letterSpacing: '-0.01em' }}>
        기업 프로필 기반 진단
      </div>
      {items.map((it: RiskMiniItem, i: number) => {
        const p = sevPill[it.severity];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'white', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
            <span style={{ background: p.bg, color: p.color, fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 10px', letterSpacing: '-0.01em', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {p.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function UserChip({ name, business }: UserChipProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'white', marginTop: 'auto' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
        {name[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{business.name}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{business.meta}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: SectionLabelProps): React.ReactElement {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', padding: '14px 22px 4px' }}>
      {children}
    </div>
  );
}

function Sidebar({ activeNav, onNav, riskItems, user }: SidebarProps): React.ReactElement {
  return (
    <aside style={{
      width: 260, flexShrink: 0,
      background: 'var(--bg-sidebar)',
      color: 'white',
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      <SidebarLogo />
      <NewChatButton onClick={() => onNav('chat')} />
      <SectionLabel>메뉴</SectionLabel>
      <NavItem icon="chat"    label="대화"            active={activeNav === 'chat'}    onClick={() => onNav('chat')} />
      <NavItem icon="dash"    label="리스크 대시보드" active={activeNav === 'dash'}    onClick={() => onNav('dash')} />
      <NavItem icon="me"      label="마이페이지"        active={activeNav === 'me'}      onClick={() => onNav('me')} />
      <NavItem icon="inquiry" label="문의글 생성"      active={activeNav === 'inquiry'} onClick={() => onNav('inquiry')} />
      <SectionLabel>리스크 현황</SectionLabel>
      <RiskMini items={riskItems} />
      <UserChip name={user.name} business={user.business} />
    </aside>
  );
}

(window as any).Sidebar = Sidebar;
