'use client';

import { useState } from 'react';
import RiskPanel from '@/components/chat/RiskPanel';
import type { RiskItemData } from '@/lib/types';

// RiskPanel 상태를 여기서 관리하고 Context로 chat/page에 전달합니다.
// 현재는 mock 데이터로 구동 — 실제 구현 시 SSE checklist_update 이벤트로 갱신합니다.
const MOCK_RISK_ITEMS: RiskItemData[] = [
  { id: 'consent_procedure', severity: 'pending', title: '수집 동의 절차', meta: '개인정보보호법 제15조' },
  { id: 'privacy_policy',    severity: 'pending', title: '처리방침 공개',  meta: '개인정보보호법 제30조' },
  { id: 'retention_period',  severity: 'pending', title: '보관 기간 설정', meta: '개인정보보호법 제21조' },
];

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [riskItems] = useState<RiskItemData[]>(MOCK_RISK_ITEMS);
  const [recentlyChangedId] = useState<string | undefined>(undefined);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
      <div className="chat-col">
        {children}
      </div>
      <RiskPanel items={riskItems} recentlyChangedId={recentlyChangedId} />
    </div>
  );
}
