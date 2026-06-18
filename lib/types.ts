export const ALLOWED_USERNAMES = ["user1", "user2"] as const;

export type Username = (typeof ALLOWED_USERNAMES)[number];

export interface AuthUser {
  id: string;
  username: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_deleted: boolean;
  edited_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender: Pick<AuthUser, "id" | "username">;
}

export interface JwtPayload {
  sub: string;
  username: Username;
  iat: number;
  exp: number;
}

export interface SessionUser {
  id: string;
  username: Username;
}

export interface ApiError {
  error: string;
}

export interface LoginResponse {
  user: SessionUser;
}

export interface MessagesResponse {
  messages: MessageWithSender[];
  total: number;
}

export interface StatusResponse {
  online: boolean;
  username: string;
  lastSeen: string | null;
}

export interface TypingPayload {
  userId: string;
  username: string;
  isTyping: boolean;
}
