"use client";

import { useEffect, useRef, useState } from "react";

interface InputBarProps {
  onSend: (content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  editingId: string | null;
  editContent: string;
  onSaveEdit: (id: string, content: string) => Promise<void>;
  onCancelEdit: () => void;
}

export default function InputBar({
  onSend,
  onTyping,
  editingId,
  editContent,
  onSaveEdit,
  onCancelEdit,
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

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
      {editingId && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-1.5">
          <span className="text-xs font-medium text-blue-600">
            Editing message
          </span>
          <button
            onClick={onCancelEdit}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="mb-2 text-xs text-red-500">{error}</p>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={sending}
          className="scrollbar-thin max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
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
