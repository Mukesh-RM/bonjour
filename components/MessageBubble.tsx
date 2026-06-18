"use client";

import { MessageWithSender } from "@/lib/types";
import { useState } from "react";

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
    return <span className="text-blue-200">✓✓</span>;
  }
  return <span className="text-blue-200/70">✓</span>;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`group flex animate-slide-up ${isOwn ? "justify-end" : "justify-start"} ${
        showAvatar ? "mt-3" : "mt-0.5"
      }`}
      onMouseLeave={() => setShowMenu(false)}
    >
      {!isOwn && showAvatar && (
        <div className="mr-2 mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">
          {message.sender?.username === "user1" ? "U1" : "U2"}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="mr-2 w-8 shrink-0" />}

      <div className="relative max-w-[75%] sm:max-w-[60%]">
        {isOwn && !message.is_deleted && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="absolute -left-8 top-1/2 hidden -translate-y-1/2 rounded p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-600 sm:block"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        )}

        {showMenu && isOwn && (
          <div className="absolute -left-28 top-0 z-10 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button
              onClick={() => {
                setShowMenu(false);
                onEdit();
              }}
              className="block w-full px-4 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                onDelete();
              }}
              className="block w-full px-4 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "rounded-br-md bg-blue-500 text-white"
              : "rounded-bl-md bg-white text-slate-800 shadow-sm"
          }`}
        >
          {message.is_deleted ? (
            <p className="text-sm italic opacity-70">This message was deleted</p>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm">
              {message.content}
            </p>
          )}

          <div
            className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
              isOwn ? "text-blue-100" : "text-slate-400"
            }`}
          >
            {message.edited_at && !message.is_deleted && (
              <span className="italic">edited</span>
            )}
            <span>{formatTime(message.created_at)}</span>
            {isOwn && !message.is_deleted && (
              <ReadReceipt readAt={message.read_at} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
