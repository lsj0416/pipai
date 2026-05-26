import { apiRequest, getBaseUrl, type ApiResponse } from './client';

// ── SSE 이벤트 타입 ───────────────────────────────────────────────────────────
export interface SSETextEvent {
  type: 'text';
  content: string;
}

export interface SSELawRefEvent {
  type: 'law_ref';
  content: { articleNo: string; title: string; summary: string };
}

export interface SSECaseRefEvent {
  type: 'case_ref';
  content: {
    businessType: string;
    employeeCount: number;
    violation: string;
    penalty: number;
    year: number;
  };
}

export interface SSEChecklistEvent {
  type: 'checklist_update';
  content: { itemId: string; status: string };
}

export interface SSEProfileSuggestionEvent {
  type: 'profile_suggestion';
  content: {
    field: string;
    label: string;
    value: string;
    displayValue: string;
  };
}

export interface SSEDoneEvent {
  type: 'done';
}

export interface SSEErrorEvent {
  type: 'error';
  content: string;
}

export type SSEEvent =
  | SSETextEvent
  | SSELawRefEvent
  | SSECaseRefEvent
  | SSEChecklistEvent
  | SSEProfileSuggestionEvent
  | SSEDoneEvent
  | SSEErrorEvent;

// ── 대화 / 메시지 타입 ────────────────────────────────────────────────────────
export interface ConversationListItem {
  conversationId: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

export interface ConversationMessage {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  lawRefs?: { articleNo: string; title: string; summary: string }[];
  caseRefs?: {
    businessType: string;
    employeeCount: number;
    violation: string;
    penaltyAmount: number;
    year: number;
  }[];
  createdAt: string;
}

export interface ConversationMessagesData {
  conversationId: string;
  messages: ConversationMessage[];
}

// ── API 함수 ──────────────────────────────────────────────────────────────────
export async function listConversations(
  token: string,
): Promise<ApiResponse<ConversationListItem[]>> {
  return apiRequest<ConversationListItem[]>('/api/conversations', { token });
}

export interface ConversationData {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export async function createConversation(
  token: string,
  title: string,
): Promise<ApiResponse<ConversationData>> {
  return apiRequest<ConversationData>('/api/conversations', {
    method: 'POST',
    token,
    body: JSON.stringify({ title }),
  });
}

// EventSource는 커스텀 헤더(Authorization)를 지원하지 않으므로
// fetch + ReadableStream 방식으로 SSE를 직접 파싱합니다.
export async function sendMessage(
  token: string,
  conversationId: string,
  message: string,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const response = await fetch(
    `${getBaseUrl()}/api/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ message }),
    },
  );

  if (!response.ok || !response.body) {
    throw new Error(`SSE 연결 실패: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      // Spring SSE: data:token (no separator space). Leading space in token must be preserved.
      const raw = line.slice(5).trimEnd();
      if (!raw) continue;
      if (raw === '[DONE]') {
        onEvent({ type: 'done' });
        return;
      }
      try {
        const event = JSON.parse(raw) as SSEEvent;
        onEvent(event);
        if (event.type === 'done') return;
      } catch {
        // 백엔드가 raw text를 전송하는 경우 text 이벤트로 처리
        onEvent({ type: 'text', content: raw });
      }
    }
  }
}

export async function deleteConversation(
  token: string,
  conversationId: string,
): Promise<void> {
  await fetch(`${getBaseUrl()}/api/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getMessages(
  token: string,
  conversationId: string,
): Promise<ApiResponse<ConversationMessagesData>> {
  return apiRequest<ConversationMessagesData>(
    `/api/conversations/${conversationId}/messages`,
    { token },
  );
}
