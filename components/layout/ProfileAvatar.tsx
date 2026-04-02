'use client';

import React from 'react';

interface ProfileAvatarProps {
  name: string;
  onClick?: () => void;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return '';
  const first = words[0].charAt(0).toUpperCase();
  const last = words.length > 1 ? words[words.length - 1].charAt(0).toUpperCase() : '';
  return first + last;
}

export function ProfileAvatar({ name, onClick }: ProfileAvatarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center min-w-[48px] min-h-[48px]"
      aria-label={`Profile: ${name}`}
    >
      <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
        <span className="text-white text-sm font-semibold leading-none select-none">
          {getInitials(name)}
        </span>
      </div>
    </button>
  );
}
