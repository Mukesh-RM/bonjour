"use client";

import { useEffect, useRef } from "react";
import { EMOJI_LIST } from "@/lib/emojis";
import { UserTheme } from "@/lib/theme";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  theme: UserTheme;
}

export default function EmojiPicker({ onSelect, onClose, theme }: EmojiPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className={`absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl border bg-white p-2 shadow-lg ${theme.inputBorder}`}
    >
      <div className="grid grid-cols-8 gap-0.5">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-slate-100 active:bg-slate-200"
            aria-label={`Insert ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
