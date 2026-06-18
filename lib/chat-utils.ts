import { Message, MessageWithSender, SessionUser, Username } from "@/lib/types";

export function buildMessageFromRow(
  row: Message,
  currentUser: SessionUser,
  otherUsername: string
): MessageWithSender {
  const isOwn = row.sender_id === currentUser.id;
  return {
    id: row.id,
    sender_id: row.sender_id,
    recipient_id: row.recipient_id,
    content: row.content,
    is_deleted: row.is_deleted,
    edited_at: row.edited_at,
    read_at: row.read_at,
    created_at: row.created_at,
    sender: isOwn
      ? { id: currentUser.id, username: currentUser.username }
      : { id: row.sender_id, username: otherUsername as Username },
  };
}

export function isChatVisible(): boolean {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "visible" && document.hasFocus();
}
