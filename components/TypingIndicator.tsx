"use client";

interface TypingIndicatorProps {
  username: string;
}

export default function TypingIndicator({ username }: TypingIndicatorProps) {
  return (
    <div className="animate-fade-in px-4 pb-2 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-2 shadow-sm">
          <span className="inline-block h-2 w-2 animate-bounce-dot rounded-full bg-slate-400 [animation-delay:-0.32s]" />
          <span className="inline-block h-2 w-2 animate-bounce-dot rounded-full bg-slate-400 [animation-delay:-0.16s]" />
          <span className="inline-block h-2 w-2 animate-bounce-dot rounded-full bg-slate-400" />
        </div>
        <span className="text-xs text-slate-400">{username} is typing...</span>
      </div>
    </div>
  );
}
