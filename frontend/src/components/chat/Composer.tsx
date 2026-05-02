'use client';

import { useState } from 'react';

interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function Composer({ onSend, disabled = false }: ComposerProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isActive = Boolean(value.trim()) && !disabled;

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      padding: '16px 32px 20px',
      background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, var(--bg-canvas) 35%)',
      pointerEvents: 'none',
    }}>
      <div style={{
        maxWidth: 760, margin: '0 auto',
        background: 'white',
        border: '1px solid var(--border-default)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-md)',
        padding: '14px 14px 14px 18px',
        display: 'flex', alignItems: 'flex-end', gap: 10,
        pointerEvents: 'auto',
      }}>
        <textarea
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="상황을 편하게 말씀해 주세요. 예: 직원 CCTV 찍어도 되나요?"
          rows={2}
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.55,
            color: 'var(--fg-1)', background: 'transparent',
            minHeight: 44, maxHeight: 180, letterSpacing: '-0.01em',
          }}
        />
        <button
          onClick={submit}
          disabled={!isActive}
          style={{
            background: isActive ? 'var(--gok-blue)' : 'var(--gray-100)',
            color: isActive ? 'white' : 'var(--gray-400)',
            border: 'none', width: 38, height: 38, borderRadius: 8,
            fontSize: 16, fontWeight: 700,
            cursor: isActive ? 'pointer' : 'default',
            flexShrink: 0,
          }}
        >↑</button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--fg-3)', marginTop: 10 }}>
        AI 답변은 참고용이에요. 중요한 사안은 전문가 확인을 권장해요.
      </div>
    </div>
  );
}
