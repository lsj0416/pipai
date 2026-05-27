// ── 기본 열거형 ──────────────────────────────────────────────────────────────
export type Severity = 'high' | 'medium' | 'safe' | 'pending';
export type SeverityActive = 'high' | 'medium' | 'safe';
export type NavId = 'chat' | 'dash' | 'me' | 'inquiry';

// ── 사용자 / 기업 ─────────────────────────────────────────────────────────────
export interface RiskMiniItem {
  label: string;
  severity: SeverityActive;
}

export interface UserBusiness {
  name: string;
  meta: string;
}

export interface UserData {
  name: string;
  business: UserBusiness;
}

// ── 채팅 메시지 Part (discriminated union) ────────────────────────────────────
export interface TextPart {
  type: 'text';
  html: string;
}

export interface LawPart {
  type: 'law';
  article: string;
  body: string;
}

export interface CasePart {
  type: 'case';
  industry?: string;
  headline: string;
}

export interface InquiryCTAPart {
  type: 'inquiry-cta';
  onClick?: () => void;
}

export interface AutoAddedPart {
  type: 'auto-added';
}

export type MessagePart =
  | TextPart
  | LawPart
  | CasePart
  | InquiryCTAPart
  | AutoAddedPart;

// ── 채팅 메시지 (discriminated union) ─────────────────────────────────────────
export interface UserMsg {
  role: 'user';
  content: string;
}

export interface AssistantMsg {
  role: 'assistant';
  parts: MessagePart[];
}

export interface QuickMsg {
  role: 'quick';
  replies: string[];
}

export type ChatMessage = UserMsg | AssistantMsg | QuickMsg;

// ── 대시보드 ──────────────────────────────────────────────────────────────────
export interface ChecklistRow {
  id?: string;
  title: string;
  severity: SeverityActive;
  law: string;
  done: boolean;
}

export interface GrowthRowData {
  title: string;
  law: string;
  severity: SeverityActive;
  applies: boolean;
}

export interface GrowthScenario {
  id: string;
  label: string;
  rows: GrowthRowData[];
}

export interface DashboardSummary {
  high: number;
  medium: number;
  safe: number;
}

// ── 문의글 ────────────────────────────────────────────────────────────────────
export interface BusinessInfo {
  industry: string;
  size: string;
  collected: string;
  method: string;
}

export interface DiagnosisInfo {
  status: string;
  law: string;
  precedent: string;
}

export interface InquiryDraft {
  id: string;
  recipient: string;
  title: string;
  biz: BusinessInfo;
  body: string;
  diagnosis: DiagnosisInfo;
  updatedAt?: string;
}

// ── RiskPanel 전용 ────────────────────────────────────────────────────────────
export interface RiskItemData {
  id: string;
  severity: Severity;
  title: string;
  meta: string;
}
