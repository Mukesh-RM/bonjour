import { MessageWithSender } from "@/lib/types";

type SenderJoin = { id: string; username: string } | { id: string; username: string }[];

export function formatMessage(
  message: {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    is_deleted: boolean;
    edited_at: string | null;
    read_at: string | null;
    created_at: string;
    sender: SenderJoin;
  }
): MessageWithSender {
  return {
    id: message.id,
    sender_id: message.sender_id,
    recipient_id: message.recipient_id,
    content: message.content,
    is_deleted: message.is_deleted,
    edited_at: message.edited_at,
    read_at: message.read_at,
    created_at: message.created_at,
    sender: Array.isArray(message.sender) ? message.sender[0] : message.sender,
  };
}
