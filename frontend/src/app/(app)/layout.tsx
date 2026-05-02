import Sidebar from '@/components/layout/Sidebar';
import type { RiskMiniItem, UserData } from '@/lib/types';

// TODO: 실제 구현에서는 서버사이드 auth + profile fetch로 교체
const MOCK_USER: UserData = {
  name: '사용자',
  business: { name: '내 사업체', meta: '프로필을 등록해 주세요' },
};

const MOCK_RISK_ITEMS: RiskMiniItem[] = [];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar riskItems={MOCK_RISK_ITEMS} user={MOCK_USER} />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
