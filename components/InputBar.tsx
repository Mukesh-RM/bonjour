"use client";

import { useEffect, useRef, useState } from "react";
import { UserTheme } from "@/lib/theme";

interface InputBarProps {
  onSend: (content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  editingId: string | null;
  editContent: string;
  onSaveEdit: (id: string, content: string) => Promise<void>;
  onCancelEdit: () => void;
  theme: UserTheme;
}

export default function InputBar({
  onSend,
  onTyping,
  editingId,
  editContent,
  onSaveEdit,
  onCancelEdit,
  theme,
}: InputBarProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingId) {
      setContent(editContent);
      textareaRef.current?.focus();
    } else {
      setContent("");
    }
  }, [editingId, editContent]);

  function handleTyping() {
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  }

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError("");

    try {
      if (editingId) {
        await onSaveEdit(editingId, trimmed);
        onCancelEdit();
      } else {
        await onSend(trimmed);
      }
      setContent("");
      onTyping(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        textareaRef.current?.focus({ preventScroll: true });
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape" && editingId) {
      onCancelEdit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    handleTyping();

    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }

  function preventBlur(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
  }

  return (
    <div className={`border-t px-4 py-3 sm:px-6 ${theme.footerBg}`}>
      {editingId && (
        <div
          className={`mb-2 flex items-center justify-between rounded-lg px-3 py-1.5 ${theme.editBanner}`}
        >
          <span className={`text-xs font-medium ${theme.editBannerText}`}>
            Editing message
          </span>
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          className={`scrollbar-thin max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:bg-white disabled:opacity-50 ${theme.inputBg} ${theme.inputBorder} ${theme.inputFocus}`}
        />
        <button
          type="button"
          onClick={handleSubmit}
          onMouseDown={preventBlur}
          onTouchStart={preventBlur}
          disabled={!content.trim() || sending}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:cursor-not-allowed ${theme.button} ${theme.buttonHover} ${theme.buttonDisabled}`}
        >
          {sending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
