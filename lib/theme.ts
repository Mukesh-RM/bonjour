import { Username } from "@/lib/types";

export interface UserTheme {
  bubble: string;
  bubbleText: string;
  bubbleMeta: string;
  button: string;
  buttonHover: string;
  inputFocus: string;
  headerAvatar: string;
  loginSelected: string;
  loginRing: string;
  readStroke: string;
  editBanner: string;
  editBannerText: string;
  otherBubble: string;
  otherBubbleText: string;
}

const THEMES: Record<Username, UserTheme> = {
  user1: {
    bubble: "bg-sky-400",
    bubbleText: "text-white",
    bubbleMeta: "text-sky-100",
    button: "bg-sky-500",
    buttonHover: "hover:bg-sky-600",
    inputFocus: "focus:border-sky-300",
    headerAvatar: "bg-sky-100 text-sky-700",
    loginSelected: "border-sky-400 bg-sky-50",
    loginRing: "bg-sky-500",
    readStroke: "#7dd3fc",
    editBanner: "bg-sky-50",
    editBannerText: "text-sky-600",
    otherBubble: "bg-white border border-sky-100 shadow-sm",
    otherBubbleText: "text-slate-800",
  },
  user2: {
    bubble: "bg-pink-400",
    bubbleText: "text-white",
    bubbleMeta: "text-pink-100",
    button: "bg-pink-500",
    buttonHover: "hover:bg-pink-600",
    inputFocus: "focus:border-pink-300",
    headerAvatar: "bg-pink-100 text-pink-700",
    loginSelected: "border-pink-400 bg-pink-50",
    loginRing: "bg-pink-500",
    readStroke: "#f9a8d4",
    editBanner: "bg-pink-50",
    editBannerText: "text-pink-600",
    otherBubble: "bg-white border border-pink-100 shadow-sm",
    otherBubbleText: "text-slate-800",
  },
};

export function getUserTheme(username: string): UserTheme {
  if (username === "user2") return THEMES.user2;
  return THEMES.user1;
}

export function getOtherUserTheme(username: string): UserTheme {
  return username === "user1" ? THEMES.user2 : THEMES.user1;
}
