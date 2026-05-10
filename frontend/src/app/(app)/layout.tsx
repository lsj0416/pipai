import { cookies } from 'next/headers';
import Sidebar from '@/components/layout/Sidebar';
import type { RiskMiniItem, SeverityActive, UserData } from '@/lib/types';
import { getProfile } from '@/lib/api/profile';
import { getRisks } from '@/lib/api/dashboard';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value ?? null;

  let userData: UserData = {
    name: '사용자',
    business: { name: '내 사업체', meta: '프로필을 등록해 주세요' },
  };
  let riskItems: RiskMiniItem[] = [];

  if (token) {
    try {
      const profileRes = await getProfile(token);
      if (profileRes.success && profileRes.data) {
        const p = profileRes.data;
        userData = {
          name: '사용자',
          business: {
            name: p.businessType ?? '내 사업체',
            meta: p.employeeCount ? `직원 ${p.employeeCount}명` : '프로필을 등록해 주세요',
          },
        };
      }
    } catch {
      // 프로필 로드 실패 시 기본값 유지
    }

    try {
      const riskRes = await getRisks(token);
      if (riskRes.success && riskRes.data) {
        const levelMap: Record<string, SeverityActive> = {
          IMMEDIATE: 'high',
          CHECK_NEEDED: 'medium',
          GOOD: 'safe',
        };
        riskItems = riskRes.data
          .filter(r => !r.resolved)
          .slice(0, 5)
          .map(r => ({
            label: r.title,
            severity: levelMap[r.level] ?? 'medium',
          }));
      }
    } catch {
      // 리스크 로드 실패 시 빈 목록 유지
    }
  }

  return (
    <div className="app-shell">
      <Sidebar riskItems={riskItems} user={userData} />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
