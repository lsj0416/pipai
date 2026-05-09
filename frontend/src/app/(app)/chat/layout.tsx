'use client';

import { useState } from 'react';
import RiskPanel from '@/components/chat/RiskPanel';
import type { RiskItemData } from '@/lib/types';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [riskItems] = useState<RiskItemData[]>([]);
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
