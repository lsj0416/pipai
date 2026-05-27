'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Topbar from '@/components/layout/Topbar';
import ChatThread from '@/components/chat/ChatThread';
import Composer from '@/components/chat/Composer';
import type { ChatMessage } from '@/lib/types';
import { createConversation, sendMessage, getMessages, deleteConversation } from '@/lib/api/conversations';
import type { TopbarMenuItem } from '@/components/layout/Topbar';
import { patchProfileField } from '@/lib/api/profile';

function mdToHtml(html: string): string {
  return html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/([^>])(<strong>)/g, '$1<br/>$2')
    .replace(/<\/strong>(\s*)- /g, '</strong>$1<br/>• ')
    .replace(/(<br\/>|\n)- /g, '$1• ')
    .replace(/([.!?])\s*- /g, '$1<br/>• ');
}

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

  interface ProfileSuggestion {
    field: string;
    label: string;
    value: string;
    displayValue: string;
  }

  const conversationIdRef = useRef<string | null>(existingConvId);
  const [convId, setConvId] = useState<string | null>(existingConvId);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(!!existingConvId);
  const [profileSuggestions, setProfileSuggestions] = useState<ProfileSuggestion[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // existingConvId가 null이 되는 경우(삭제 후 /chat으로 이동)에도 반드시 초기화
    conversationIdRef.current = existingConvId;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConvId(existingConvId);
  }, [existingConvId]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }

    if (existingConvId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([WELCOME]);
      getMessages(token, existingConvId)
        .then(res => {
          if (cancelled) return;
          if (res.success && res.data && res.data.messages.length > 0) {
            const loaded: ChatMessage[] = res.data.messages.map(m =>
              m.role === 'user'
                ? { role: 'user' as const, content: m.content }
                : {
                    role: 'assistant' as const,
                    parts: [{ type: 'text' as const, html: mdToHtml(m.content.replace(/\n/g, '<br/>')) }],
                  },
            );
            setMessages(loaded);
          }
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    } else {
      setMessages([WELCOME]);
      setLoading(false);
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
        } else if (event.type === 'profile_suggestion') {
          setProfileSuggestions(prev => {
            if (prev.some(s => s.field === event.content.field)) return prev;
            return [...prev, event.content];
          });
        }
      });
      return true;
    } catch {
      appendErrorToLast();
      return true;
    } finally {
      setStreaming(false);
      // 스트리밍 완료 후 마크다운(**bold**, 목록) 변환
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role !== 'assistant') return prev;
        const parts = last.parts.map(p =>
          p.type === 'text' ? { ...p, html: mdToHtml(p.html) } : p
        );
        copy[copy.length - 1] = { ...last, parts };
        return copy;
      });
      window.dispatchEvent(new CustomEvent('conversationUpdate'));
    }
  };

  const hasUserMessage = messages.some(m => m.role === 'user');

  const handleSaveField = async (suggestion: ProfileSuggestion) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await patchProfileField(token, suggestion.field, suggestion.value);
    } catch {}
    setProfileSuggestions(prev => prev.filter(s => s.field !== suggestion.field));
  };

  const handleDismissField = (field: string) => {
    setProfileSuggestions(prev => prev.filter(s => s.field !== field));
  };

  const handleExport = () => {
    const lines: string[] = [`대화 내보내기 — ${new Date().toLocaleString('ko-KR')}\n`];
    messages.forEach(m => {
      if (m.role === 'user') {
        lines.push(`[사용자]\n${m.content}\n`);
      } else if (m.role === 'assistant') {
        const text = m.parts
          .filter(p => p.type === 'text')
          .map(p => p.type === 'text' ? p.html.replace(/<[^>]+>/g, '') : '')
          .join('');
        if (text.trim()) lines.push(`[AI]\n${text.trim()}\n`);
      }
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PIPA_대화_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!convId) return;
    if (!window.confirm('이 대화를 삭제하시겠어요? 복구할 수 없습니다.')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    await deleteConversation(token, convId);
    window.dispatchEvent(new CustomEvent('conversationUpdate'));
    router.push('/chat');
  };

  const menuItems: TopbarMenuItem[] = [
    ...(hasUserMessage ? [{ label: '이 대화 내보내기', onClick: handleExport }] : []),
    ...(convId ? [{ label: '이 대화 삭제', onClick: handleDelete, danger: true }] : []),
  ];

  return (
    <>
      <Topbar
        title="개인정보보호 리스크 진단"
        status={streaming ? '응답 중...' : '진행 중'}
        menuItems={menuItems}
      />
      <div className="chat-scroll" ref={scrollRef}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 14 }}>
            대화 이력을 불러오는 중...
          </div>
        ) : (
          <ChatThread
            messages={messages}
            onPickQuick={send}
            streaming={streaming}
            onInquiry={hasUserMessage && convId ? () => router.push(`/inquiry?conversationId=${convId}`) : undefined}
          />
        )}
      </div>
      {profileSuggestions.length > 0 && (
        <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profileSuggestions.map(s => (
            <div key={s.field} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 14px', fontSize: 13,
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{s.label}</strong>
                {' '}
                <span style={{ color: 'var(--color-gok-blue)', fontWeight: 600 }}>{s.displayValue}</span>
                {' '}으로 저장할까요?
              </span>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                <button
                  onClick={() => handleSaveField(s)}
                  style={{
                    background: 'var(--color-gok-blue)', color: '#fff', border: 'none',
                    borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  저장
                </button>
                <button
                  onClick={() => handleDismissField(s.field)}
                  style={{
                    background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  무시
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
