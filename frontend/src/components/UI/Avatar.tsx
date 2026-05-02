import { Zap } from 'lucide-react';

interface AvatarProps {
  type: 'user' | 'ai';
  size?: 'sm' | 'md';
}

export function Avatar({ type, size = 'sm' }: AvatarProps) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  if (type === 'ai') {
    return (
      <div
        className={`${dim} rounded-full flex items-center justify-center flex-shrink-0`}
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
          boxShadow: '0 0 10px rgba(124,58,237,0.4)',
        }}
      >
        <Zap size={size === 'sm' ? 14 : 18} className="text-white" fill="white" />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold`}
      style={{
        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        fontSize: size === 'sm' ? '12px' : '14px',
      }}
    >
      U
    </div>
  );
}
