"use client";

import { MessageWithSender } from "@/lib/types";
import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

import { UserTheme } from "@/lib/theme";

interface MessageListProps {
  messages: MessageWithSender[];
  currentUserId: string;
  loading: boolean;
  ownTheme: UserTheme;
  otherTheme: UserTheme;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onVisible?: () => void;
}

export default function MessageList({
  messages,
  currentUserId,
  loading,
  ownTheme,
  otherTheme,
  onEdit,
  onDelete,
  onVisible,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (messages.length > prevLengthRef.current || !loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      onVisible?.();
    }
    prevLengthRef.current = messages.length;
  }, [messages, loading, onVisible]);

  const visibleMessages = messages.filter((m) => !m.is_deleted);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4 sm:px-6"
    >
      {visibleMessages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-slate-400">
            No messages yet. Say hello!
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {visibleMessages.map((message, index) => {
            const isOwn = message.sender_id === currentUserId;
            const prevMessage = visibleMessages[index - 1];
            const showAvatar =
              !prevMessage || prevMessage.sender_id !== message.sender_id;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                ownTheme={ownTheme}
                otherTheme={otherTheme}
                onEdit={() => onEdit(message.id)}
                onDelete={() => onDelete(message.id)}
              />
            );
          })}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
