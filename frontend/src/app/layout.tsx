import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PIPAi — 개인정보보호 AI 컨설팅',
  description: '개인정보보호법을 쉽고 빠르게. AI가 리스크를 진단하고 전문가 채널로 연결합니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
