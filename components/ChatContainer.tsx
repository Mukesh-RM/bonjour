"use client";

import { MessageWithSender, SessionUser } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { buildMessageFromRow, isChatVisible } from "@/lib/chat-utils";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import type { Message } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getDisplayName, getAvatarLabel } from "@/lib/display-names";
import { getChatTheme, getOtherUserTheme, getTypingTheme } from "@/lib/theme";

interface ChatContainerProps {
  currentUser: SessionUser;
  otherUsername: string;
}

export default function ChatContainer({
  currentUser,
  otherUsername,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const presenceRef = useRef<RealtimeChannel | null>(null);
  const typingRef = useRef<RealtimeChannel | null>(null);
  const isTypingRef = useRef(false);
  const typingStopRef = useRef<NodeJS.Timeout | null>(null);

  const chatTheme = getChatTheme(currentUser.username);
  const otherTheme = getOtherUserTheme(currentUser.username);
  const typingTheme = getTypingTheme(otherUsername);

  const markMessagesRead = useCallback(async () => {
    if (!isChatVisible()) return;
    try {
      await fetch("/api/messages/read", { method: "POST" });
    } catch {
      return;
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages?limit=100&offset=0");
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
      if (isChatVisible()) {
        await markMessagesRead();
      }
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  }, [markMessagesRead]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const onVisible = () => {
      if (isChatVisible()) {
        markMessagesRead();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [markMessagesRead]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const messagesChannel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as Message;
          if (row.is_deleted) return;

          const incoming = buildMessageFromRow(row, currentUser, otherUsername);

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });

          if (row.recipient_id === currentUser.id && isChatVisible()) {
            markMessagesRead();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updated = payload.new as Message;

          if (updated.is_deleted) {
            setMessages((prev) => prev.filter((m) => m.id !== updated.id));
            return;
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? buildMessageFromRow(updated, currentUser, otherUsername)
                : m
            )
          );
        }
      )
      .subscribe();

    const presenceChannel = supabase.channel("bonjour-presence", {
      config: { presence: { key: currentUser.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        let online = false;

        for (const [key, presences] of Object.entries(state)) {
          if (key === currentUser.id) continue;
          const presence = presences[0] as { online?: boolean };
          if (presence?.online) online = true;
        }

        setOtherOnline(online);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            online: true,
            username: currentUser.username,
          });
        }
      });

    presenceRef.current = presenceChannel;

    const typingChannel = supabase.channel("bonjour-typing", {
      config: { broadcast: { ack: false, self: false } },
    });

    typingChannel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const data = payload as { userId?: string; isTyping?: boolean };
        if (data.userId && data.userId !== currentUser.id) {
          setOtherTyping(Boolean(data.isTyping));
        }
      })
      .on("broadcast", { event: "reset" }, () => {
        setMessages([]);
      })
      .subscribe();

    typingRef.current = typingChannel;

    const handleUnload = () => {
      presenceChannel.untrack();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [currentUser, otherUsername, markMessagesRead]);

  async function handleSend(content: string) {
    const trimmed = content.trim();
    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageWithSender = {
      id: tempId,
      sender_id: currentUser.id,
      recipient_id: "pending",
      content: trimmed,
      is_deleted: false,
      edited_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
      sender: { id: currentUser.id, username: currentUser.username },
    };

    setMessages((prev) => [...prev, optimistic]);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    });

    if (!res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const data = await res.json();
      throw new Error(data.error || "Failed to send");
    }

    const data = await res.json();
    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? data.message : m))
    );
  }

  async function handleEdit(id: string, content: string) {
    const res = await fetch(`/api/messages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to edit");
    }

    const data = await res.json();
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? data.message : m))
    );
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));

    const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });

    if (!res.ok) {
      await fetchMessages();
      const data = await res.json();
      throw new Error(data.error || "Failed to delete");
    }
  }

  function handleTyping(isTyping: boolean) {
    isTypingRef.current = isTyping;

    if (typingRef.current) {
      typingRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: currentUser.id,
          username: currentUser.username,
          isTyping,
        },
      });
    }

    if (typingStopRef.current) {
      clearTimeout(typingStopRef.current);
    }

    if (isTyping) {
      typingStopRef.current = setTimeout(() => {
        isTypingRef.current = false;
        typingRef.current?.send({
          type: "broadcast",
          event: "typing",
          payload: {
            userId: currentUser.id,
            username: currentUser.username,
            isTyping: false,
          },
        });
      }, 2500);
    }
  }

  async function handleResetChat() {
    setResetting(true);
    try {
      const res = await fetch("/api/messages/reset", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset chat");
      }
      setMessages([]);
      setShowResetConfirm(false);
      typingRef.current?.send({
        type: "broadcast",
        event: "reset",
        payload: { userId: currentUser.id },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset chat");
    } finally {
      setResetting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className={`flex h-screen flex-col ${chatTheme.pageBg}`}>
      <header
        className={`flex items-center justify-between border-b px-4 py-3 shadow-sm sm:px-6 ${chatTheme.headerBg} ${chatTheme.headerBorder}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${otherTheme.headerAvatar}`}
            >
              {getAvatarLabel(otherUsername)}
            </div>
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                otherOnline ? "bg-green-500" : "bg-slate-300"
              }`}
            />
          </div>
          <div>
            <h1 className={`font-semibold ${otherTheme.accentText}`}>
              {getDisplayName(otherUsername)}
            </h1>
            {otherTyping ? (
              <p
                className={`flex items-center gap-1.5 text-xs font-medium ${typingTheme.accentText}`}
              >
                <span className="flex items-center gap-0.5">
                  <span
                    className={`inline-block h-1.5 w-1.5 animate-bounce-dot rounded-full ${typingTheme.button} [animation-delay:-0.32s]`}
                  />
                  <span
                    className={`inline-block h-1.5 w-1.5 animate-bounce-dot rounded-full ${typingTheme.button} [animation-delay:-0.16s]`}
                  />
                  <span
                    className={`inline-block h-1.5 w-1.5 animate-bounce-dot rounded-full ${typingTheme.button}`}
                  />
                </span>
                typing...
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                {otherOnline ? "online" : "offline"}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="rounded-lg px-2 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600 sm:px-3 sm:text-sm"
          >
            Reset
          </button>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium sm:px-3 sm:text-sm ${chatTheme.userBadge}`}
          >
            {getDisplayName(currentUser.username)}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-2 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:px-3 sm:text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Reset chat?</h2>
            <p className="mt-2 text-sm text-slate-500">
              This deletes the entire conversation for both of you. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetChat}
                disabled={resetting}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {resetting ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      <MessageList
        messages={messages}
        currentUserId={currentUser.id}
        loading={loading}
        ownTheme={chatTheme}
        otherTheme={otherTheme}
        onEdit={setEditingId}
        onDelete={handleDelete}
        onVisible={markMessagesRead}
      />

      <InputBar
        onSend={handleSend}
        onTyping={handleTyping}
        editingId={editingId}
        onCancelEdit={() => setEditingId(null)}
        editContent={
          editingId
            ? messages.find((m) => m.id === editingId)?.content ?? ""
            : ""
        }
        onSaveEdit={handleEdit}
        theme={chatTheme}
      />
    </div>
  );
}
