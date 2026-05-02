'use client';

import { useRouter } from 'next/navigation';
import InquiryGen from '@/components/inquiry/InquiryGen';
import type { InquiryDraft } from '@/lib/types';

// TODO: 실제 구현 시 searchParams.conversationId → lib/api/inquiry.ts generateInquiry()로 교체
const MOCK_DRAFT: InquiryDraft = {
  recipient: '개인정보보호위원회 기술지원 컨설팅',
  title: '개인정보 수집 동의 절차 관련 문의',
  biz: {
    industry: '요식업 (카페)',
    size: '직원 3명 / 연매출 2억원',
    collected: '고객 연락처 (전화번호)',
    method: '문자 수신',
  },
  body: '현재 고객 전화번호를 별도 동의 없이 문자로 수집하고 있습니다. 개인정보보호법 제15조 수집 동의 절차 준수 여부 및 개선 방향에 대해 문의드립니다.',
  diagnosis: {
    status: '위반 가능성 높음',
    law: '개인정보보호법 제15조',
    precedent: '과태료 500만원 (2023)',
  },
};

export default function InquiryPage() {
  const router = useRouter();
  return <InquiryGen draft={MOCK_DRAFT} onBack={() => router.push('/chat')} />;
}
