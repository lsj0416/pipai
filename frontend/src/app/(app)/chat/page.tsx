'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/layout/Topbar';
import ChatThread from '@/components/chat/ChatThread';
import Composer from '@/components/chat/Composer';
import type { ChatMessage } from '@/lib/types';

// 프로토타입 시나리오 데이터 (백엔드 연동 전 임시)
type ScenarioId = 'consent' | 'cctv' | 'growth' | 'breach';

interface Scenario {
  label: string;
  title: string;
  status: string;
  initial: ChatMessage[];
}

const SCENARIOS: Record<ScenarioId, Scenario> = {
  consent: {
    label: '시나리오 0 · 수집 동의', title: '개인정보보호 리스크 진단', status: '진행 중',
    initial: [
      { role: 'assistant', parts: [{ type: 'text', html: '안녕하세요, 사장님. 카페 행복한아침의 개인정보보호 리스크 진단을 시작할게요.<br/><br/>먼저 한 가지만 여쭤볼게요. <b>고객 전화번호 수집</b>에 대해 안내드릴 수 있도록, 현재 동의서를 받고 계신지 알려주세요.' }] },
      { role: 'quick', replies: ['네, 동의서 있어요', '아니요, 따로 없어요'] },
    ],
  },
  cctv: {
    label: '시나리오 1 · CCTV', title: 'CCTV 설치 상담', status: '진행 중',
    initial: [
      { role: 'user', content: '직원 CCTV 찍어도 되나요?' },
      { role: 'assistant', parts: [
        { type: 'text', html: '가능하지만 <b>사전 고지</b>가 필요해요.' },
        { type: 'law', article: '개인정보보호법 제25조', body: '누구든지 영상정보처리기기를 설치·운영하려는 경우에는 정보주체가 쉽게 알아볼 수 있도록 안내판을 설치하는 등 필요한 조치를 해야 합니다.' },
        { type: 'case', headline: '제조업 B사 — 직원에게 사전 고지 없이 사무실 CCTV 운영, 과태료 300만원 처분 (2022)' },
      ]},
    ],
  },
  growth: {
    label: '시나리오 2 · 성장 트리거', title: '직원 채용 계획 상담', status: '진행 중',
    initial: [
      { role: 'user', content: '곧 직원을 10명 넘길 것 같아요' },
      { role: 'assistant', parts: [
        { type: 'text', html: '미리 챙기시는 게 좋아요. <b>직원 10명 초과 시 개인정보보호책임자(CPO) 지정</b>이 의무예요.' },
        { type: 'law', article: '개인정보보호법 제31조', body: '개인정보처리자는 개인정보의 처리에 관한 업무를 총괄해서 책임질 개인정보 보호책임자를 지정해야 합니다.' },
        { type: 'auto-added' },
      ]},
    ],
  },
  breach: {
    label: '시나리오 3 · 유출 사고', title: '개인정보 유출 사고 대응', status: '긴급',
    initial: [
      { role: 'user', content: '개인정보 유출 사고가 났어요' },
      { role: 'assistant', parts: [
        { type: 'text', html: '즉시 신고 의무가 있는 상황이에요. 천천히 함께 정리해 봐요.' },
        { type: 'law', article: '개인정보보호법 제34조', body: '개인정보처리자는 개인정보가 유출되었음을 알게 되었을 때에는 지체 없이 정보주체에게 알리고, 일정 규모 이상의 경우 보호위원회 또는 전문기관에 신고해야 합니다.' },
        { type: 'inquiry-cta' },
      ]},
    ],
  },
};

function bindScenario(id: ScenarioId, onInquiry: () => void): ChatMessage[] {
  return SCENARIOS[id].initial.map(m => {
    if (m.role !== 'assistant') return m;
    return {
      ...m,
      parts: m.parts.map(p =>
        p.type === 'inquiry-cta' ? { ...p, onClick: onInquiry } : p
      ),
    };
  });
}

export default function ChatPage() {
  const router = useRouter();
  const onInquiry = () => router.push('/inquiry');
  const [scenarioId, setScenarioId] = useState<ScenarioId>('consent');
  const [messages, setMessages] = useState<ChatMessage[]>(() => bindScenario('consent', onInquiry));
  const scrollRef = useRef<HTMLDivElement>(null);

  const scenario = SCENARIOS[scenarioId];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const switchScenario = (id: ScenarioId) => {
    setScenarioId(id);
    setMessages(bindScenario(id, onInquiry));
  };

  const send = (text: string) => {
    setMessages(prev => {
      const filtered = prev.filter(x => x.role !== 'quick');
      return [...filtered, { role: 'user', content: text }];
    });
    // TODO: 실제 SSE 스트리밍으로 교체 (lib/api/conversations.ts sendMessage)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', parts: [{ type: 'text', html: '확인하고 있어요. 잠시만 기다려 주세요.' }] },
      ]);
    }, 700);
  };

  return (
    <>
      <Topbar title={scenario.title} status={scenario.status} />
      <div className="scenario-tabs">
        {(Object.keys(SCENARIOS) as ScenarioId[]).map(id => (
          <button key={id} className={id === scenarioId ? 'active' : ''} onClick={() => switchScenario(id)}>
            {SCENARIOS[id].label}
          </button>
        ))}
      </div>
      <div className="chat-scroll" ref={scrollRef}>
        <ChatThread messages={messages} onPickQuick={send} />
      </div>
      <Composer onSend={send} />
    </>
  );
}
