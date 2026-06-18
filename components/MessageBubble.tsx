"use client";

import { MessageWithSender } from "@/lib/types";
import { getAvatarLabel } from "@/lib/display-names";
import { useEffect, useRef, useState } from "react";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ReadReceipt({ readAt }: { readAt: string | null }) {
  if (readAt) {
    return (
      <svg
        className="inline-block h-3.5 w-4 shrink-0"
        viewBox="0 0 16 11"
        fill="none"
        aria-label="Read"
      >
        <path
          d="M1 5.5L4 9l2-2"
          stroke="#53bdeb"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 5.5L8.5 9 15 1.5"
          stroke="#53bdeb"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className="inline-block h-3.5 w-4 shrink-0 opacity-60"
      viewBox="0 0 16 11"
      fill="none"
      aria-label="Delivered"
    >
      <path
        d="M1 5.5L4 9l2-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 5.5L8.5 9 15 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;

    function handleOutside(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [showMenu]);

  function clearLongPress() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  function handleTouchStart() {
    if (!isOwn) return;
    clearLongPress();
    longPressRef.current = setTimeout(() => {
      setShowMenu(true);
    }, 450);
  }

  function handleTouchEnd() {
    clearLongPress();
  }

  if (message.is_deleted) {
    return null;
  }

  const senderName = message.sender?.username ?? "user1";

  return (
    <div
      className={`group flex animate-slide-up ${isOwn ? "justify-end" : "justify-start"} ${
        showAvatar ? "mt-3" : "mt-0.5"
      }`}
      onMouseLeave={() => setShowMenu(false)}
    >
      {!isOwn && showAvatar && (
        <div className="mr-2 mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">
          {getAvatarLabel(senderName)}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="mr-2 w-8 shrink-0" />}

      <div ref={menuRef} className="relative max-w-[75%] sm:max-w-[60%]">
        {isOwn && (
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="absolute -left-7 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:-left-8 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
            aria-label="Message options"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        )}

        {showMenu && isOwn && (
          <div
            className={`absolute z-20 min-w-[120px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
              isOwn ? "right-0 top-full mt-1 sm:-left-28 sm:right-auto sm:top-0 sm:mt-0" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onEdit();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 active:bg-slate-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onDelete();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-red-600 active:bg-red-50"
            >
              Unsend
            </button>
          </div>
        )}

        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
          onContextMenu={(e) => {
            if (isOwn) {
              e.preventDefault();
              setShowMenu(true);
            }
          }}
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "rounded-br-md bg-blue-500 text-white"
              : "rounded-bl-md bg-white text-slate-800 shadow-sm"
          } ${isOwn ? "select-none" : ""}`}
        >
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>

          <div
            className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
              isOwn ? "text-blue-100" : "text-slate-400"
            }`}
          >
            {message.edited_at && <span className="italic">edited</span>}
            <span>{formatTime(message.created_at)}</span>
            {isOwn && <ReadReceipt readAt={message.read_at} />}
          </div>
        </div>
      </div>
    </div>
  );
}
