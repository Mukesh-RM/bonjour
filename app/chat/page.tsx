import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ChatContainer from "@/components/ChatContainer";
import { getCookieName, getOtherUsername, verifyToken } from "@/lib/auth";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCookieName())?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);
  if (!payload) {
    redirect("/login");
  }

  const currentUser = {
    id: payload.sub,
    username: payload.username,
  };

  const otherUsername = getOtherUsername(payload.username);

  return (
    <ChatContainer currentUser={currentUser} otherUsername={otherUsername} />
  );
}
