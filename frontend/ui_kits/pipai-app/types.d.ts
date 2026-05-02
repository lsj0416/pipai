// Shared global type declarations for PIPAi UI kit
// These are global scripts (no import/export) so types declared here are globally available.

type Severity = 'high' | 'medium' | 'safe' | 'pending';
type SeverityActive = 'high' | 'medium' | 'safe';
type NavId = 'chat' | 'dash' | 'me' | 'inquiry';

interface RiskMiniItem {
  label: string;
  severity: SeverityActive;
}

interface UserBusiness {
  name: string;
  meta: string;
}

interface UserData {
  name: string;
  business: UserBusiness;
}

// Message types for ChatThread
interface TextPart {
  type: 'text';
  html: string;
}

interface LawPart {
  type: 'law';
  article: string;
  body: string;
}

interface CasePart {
  type: 'case';
  industry?: string;
  headline: string;
}

interface InquiryCTAPart {
  type: 'inquiry-cta';
  onClick?: () => void;
}

interface AutoAddedPart {
  type: 'auto-added';
}

type MessagePart = TextPart | LawPart | CasePart | InquiryCTAPart | AutoAddedPart;

interface UserMsg {
  role: 'user';
  content: string;
}

interface AssistantMsg {
  role: 'assistant';
  parts: MessagePart[];
}

interface QuickMsg {
  role: 'quick';
  replies: string[];
}

type ChatMessage = UserMsg | AssistantMsg | QuickMsg;

// Dashboard types
interface ChecklistRow {
  title: string;
  severity: SeverityActive;
  law: string;
  done: boolean;
}

interface GrowthRowData {
  title: string;
  law: string;
  severity: SeverityActive;
  applies: boolean;
}

interface GrowthScenario {
  id: string;
  label: string;
  rows: GrowthRowData[];
}

interface DashboardSummary {
  high: number;
  medium: number;
  safe: number;
}

// InquiryGen types
interface BusinessInfo {
  industry: string;
  size: string;
  collected: string;
  method: string;
}

interface DiagnosisInfo {
  status: string;
  law: string;
  precedent: string;
}

interface InquiryDraft {
  recipient: string;
  title: string;
  biz: BusinessInfo;
  body: string;
  diagnosis: DiagnosisInfo;
}
