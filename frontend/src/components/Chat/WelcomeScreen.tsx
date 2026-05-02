import { Zap } from 'lucide-react';
import type { AIMode } from '../../types';
import { MODES } from '../../types';
import { SuggestionChips } from './SuggestionChips';

interface WelcomeScreenProps {
  mode: AIMode;
  onSuggestion: (text: string) => void;
}

export function WelcomeScreen({ mode, onSuggestion }: WelcomeScreenProps) {
  const modeConfig = MODES[mode];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-6 animate-fade-in-up">
      {/* Logo */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse-glow"
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
        }}
      >
        <Zap size={28} className="text-white" fill="white" />
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Hello, I'm TutorAI
        </h1>
        <p className="text-base max-w-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          {modeConfig.subtitle}
        </p>
      </div>

      {/* Suggestion Chips */}
      <SuggestionChips mode={mode} onSelect={onSuggestion} />
    </div>
  );
}
