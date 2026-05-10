'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Topbar from '@/components/layout/Topbar';
import ChatThread from '@/components/chat/ChatThread';
import Composer from '@/components/chat/Composer';
import type { ChatMessage } from '@/lib/types';
import { createConversation, sendMessage, getMessages } from '@/lib/api/conversations';

const WELCOME: ChatMessage = {
  role: 'assistant',
  parts: [{
    type: 'text',
    html: '안녕하세요! 개인정보보호법(PIPA) 관련 리스크 진단을 도와드릴게요.<br/><br/>사업체 운영 중 궁금한 점이나 우려되는 상황을 편하게 말씀해 주세요.',
  }],
};

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingConvId = searchParams.get('conversationId');

  const conversationIdRef = useRef<string | null>(existingConvId);
  const [convId, setConvId] = useState<string | null>(existingConvId);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(!!existingConvId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }

    if (existingConvId) {
      getMessages(token, existingConvId)
        .then(res => {
          if (cancelled) return;
          if (res.success && res.data && res.data.messages.length > 0) {
            const loaded: ChatMessage[] = res.data.messages.map(m =>
              m.role === 'user'
                ? { role: 'user' as const, content: m.content }
                : {
                    role: 'assistant' as const,
                    parts: [{ type: 'text' as const, html: m.content.replace(/\n/g, '<br/>') }],
                  },
            );
            setMessages(loaded);
          }
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    } else {
      createConversation(token, '개인정보보호 리스크 진단')
        .then(res => {
          if (!cancelled && res.success && res.data) {
            conversationIdRef.current = res.data.id;
            setConvId(res.data.id);
          }
        })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [router, existingConvId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const ensureConversationId = async (token: string): Promise<string | null> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    try {
      const res = await createConversation(token, '개인정보보호 리스크 진단');
      if (res.success && res.data) {
        conversationIdRef.current = res.data.id;
        setConvId(res.data.id);
        return res.data.id;
      }
    } catch {}
    return null;
  };

  const replaceLastAssistantText = (html: string) => {
    setMessages(prev => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role !== 'assistant') return [...prev, { role: 'assistant', parts: [{ type: 'text', html }] }];
      const parts = [...last.parts];
      const lastPart = parts[parts.length - 1];
      if (lastPart?.type === 'text' && !lastPart.html) {
        parts[parts.length - 1] = { type: 'text', html };
        copy[copy.length - 1] = { ...last, parts };
        return copy;
      }
      return [...prev, { role: 'assistant', parts: [{ type: 'text', html }] }];
    });
  };

  const appendErrorToLast = () => {
    replaceLastAssistantText('죄송합니다. 응답 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
  };

  const send = async (text: string): Promise<boolean> => {
    if (streaming) return false;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return false;
    }

    setMessages(prev => [
      ...prev.filter(x => x.role !== 'quick'),
      { role: 'user', content: text },
      { role: 'assistant', parts: [{ type: 'text', html: '' }] },
    ]);
    setStreaming(true);

    try {
      const cid = await ensureConversationId(token);
      if (!cid) {
        replaceLastAssistantText('서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.<br/>백엔드 서버가 실행 중인지 확인해 주세요.');
        return true;
      }

      await sendMessage(token, cid, text, (event) => {
        if (event.type === 'error') {
          replaceLastAssistantText(
            typeof event.content === 'string'
              ? event.content
              : '죄송합니다. AI 서비스에 일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
          );
        } else if (event.type === 'text' && event.content) {
          const chunk = event.content.replace(/\n/g, '<br/>');
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role !== 'assistant') return prev;
            const parts = [...last.parts];
            const lastPart = parts[parts.length - 1];
            if (lastPart?.type === 'text') {
              parts[parts.length - 1] = { type: 'text', html: lastPart.html + chunk };
              copy[copy.length - 1] = { ...last, parts };
            }
            return copy;
          });
        } else if (event.type === 'law_ref') {
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role !== 'assistant') return prev;
            copy[copy.length - 1] = {
              ...last,
              parts: [...last.parts, { type: 'law', article: event.content.articleNo, body: event.content.summary }],
            };
            return copy;
          });
        } else if (event.type === 'case_ref') {
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role !== 'assistant') return prev;
            copy[copy.length - 1] = {
              ...last,
              parts: [...last.parts, {
                type: 'case',
                headline: `${event.content.businessType} — ${event.content.violation} (${event.content.year})`,
              }],
            };
            return copy;
          });
        } else if (event.type === 'checklist_update') {
          localStorage.setItem('dashboardNeedsRefresh', 'true');
          window.dispatchEvent(new CustomEvent('riskUpdate'));
        }
      });
      return true;
    } catch {
      appendErrorToLast();
      return true;
    } finally {
      setStreaming(false);
    }
  };

  const hasUserMessage = messages.some(m => m.role === 'user');

  return (
    <>
      <Topbar title="개인정보보호 리스크 진단" status={streaming ? '응답 중...' : '진행 중'} />
      {hasUserMessage && convId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 32px 8px', flexShrink: 0 }}>
          <button
            onClick={() => router.push(`/inquiry?conversationId=${convId}`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-tint-blue)', color: 'var(--gok-blue)',
              border: '1px solid var(--border-subtle)', borderRadius: 8,
              padding: '6px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6M9 13h6M9 17h6"/>
            </svg>
            문의글 자동 생성
          </button>
        </div>
      )}
      <div className="chat-scroll" ref={scrollRef}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 14 }}>
            대화 이력을 불러오는 중...
          </div>
        ) : (
          <ChatThread messages={messages} onPickQuick={send} />
        )}
      </div>
      <Composer onSend={send} disabled={streaming || loading} />
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageContent />
    </Suspense>
  );
}
