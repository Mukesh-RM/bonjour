"use client";

import { MessageWithSender, SessionUser } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import TypingIndicator from "./TypingIndicator";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages?limit=100&offset=0");
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const messagesChannel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as MessageWithSender;
            const supabase = getSupabaseBrowser();
            const { data } = await supabase
              .from("messages")
              .select(
                "id, sender_id, recipient_id, content, is_deleted, edited_at, read_at, created_at, sender:auth_users!messages_sender_id_fkey(id, username)"
              )
              .eq("id", row.id)
              .single();

            if (data) {
              const sender = Array.isArray(data.sender) ? data.sender[0] : data.sender;
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev;
                return [
                  ...prev,
                  {
                    id: data.id,
                    sender_id: data.sender_id,
                    recipient_id: data.recipient_id,
                    content: data.content,
                    is_deleted: data.is_deleted,
                    edited_at: data.edited_at,
                    read_at: data.read_at,
                    created_at: data.created_at,
                    sender,
                  },
                ];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as MessageWithSender;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === updated.id
                  ? {
                      ...m,
                      content: updated.content,
                      is_deleted: updated.is_deleted,
                      edited_at: updated.edited_at,
                      read_at: updated.read_at,
                    }
                  : m
              )
            );
          }
        }
      )
      .subscribe();

    const presenceChannel = supabase.channel("bonjour-presence", {
      config: { presence: { key: currentUser.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const otherEntries = Object.entries(state).filter(
          ([key]) => key !== currentUser.id
        );

        let online = false;
        let typing = false;

        for (const [, presences] of otherEntries) {
          const presence = presences[0] as {
            online?: boolean;
            isTyping?: boolean;
          };
          if (presence?.online) online = true;
          if (presence?.isTyping) typing = true;
        }

        setOtherOnline(online);
        setOtherTyping(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            online: true,
            isTyping: false,
            username: currentUser.username,
          });
        }
      });

    channelRef.current = presenceChannel;

    const heartbeat = setInterval(() => {
      presenceChannel.track({
        online: true,
        isTyping: false,
        username: currentUser.username,
      });
      fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: true }),
      }).catch(() => {});
    }, 30_000);

    const handleUnload = () => {
      presenceChannel.untrack();
      fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: false }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser.id, currentUser.username]);

  async function handleSend(content: string) {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to send");
    }

    const data = await res.json();
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.message.id)) return prev;
      return [...prev, data.message];
    });
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
    const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete");
    }

    const data = await res.json();
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? data.message : m))
    );
  }

  async function handleTyping(isTyping: boolean) {
    if (channelRef.current) {
      await channelRef.current.track({
        online: true,
        isTyping,
        username: currentUser.username,
      });
    }

    fetch("/api/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping }),
    }).catch(() => {});
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
              {otherUsername === "user1" ? "U1" : "U2"}
            </div>
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                otherOnline ? "bg-green-500" : "bg-slate-300"
              }`}
            />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900">{otherUsername}</h1>
            <p className="text-xs text-slate-500">
              {otherOnline ? "online" : "offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {currentUser.username}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            Logout
          </button>
        </div>
      </header>

      <MessageList
        messages={messages}
        currentUserId={currentUser.id}
        loading={loading}
        onEdit={setEditingId}
        onDelete={handleDelete}
      />

      {otherTyping && <TypingIndicator username={otherUsername} />}

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
      />
    </div>
  );
}
