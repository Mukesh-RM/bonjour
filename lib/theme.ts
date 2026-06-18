import { Username } from "@/lib/types";

export interface UserTheme {
  bubble: string;
  bubbleText: string;
  bubbleMeta: string;
  button: string;
  buttonHover: string;
  buttonDisabled: string;
  inputBorder: string;
  inputFocus: string;
  inputBg: string;
  headerAvatar: string;
  headerBorder: string;
  headerBg: string;
  pageBg: string;
  userBadge: string;
  accentText: string;
  loginSelected: string;
  loginRing: string;
  readStroke: string;
  editBanner: string;
  editBannerText: string;
  otherBubble: string;
  otherBubbleText: string;
  footerBg: string;
  spinner: string;
}

const THEMES: Record<Username, UserTheme> = {
  user1: {
    bubble: "bg-sky-400",
    bubbleText: "text-white",
    bubbleMeta: "text-sky-100",
    button: "bg-sky-500",
    buttonHover: "hover:bg-sky-600",
    buttonDisabled: "disabled:bg-sky-300",
    inputBorder: "border-sky-200",
    inputFocus: "focus:border-sky-400 focus:ring-2 focus:ring-sky-100",
    inputBg: "bg-sky-50",
    headerAvatar: "bg-sky-200 text-sky-800",
    headerBorder: "border-sky-200",
    headerBg: "bg-sky-50",
    pageBg: "bg-sky-50/80",
    userBadge: "bg-sky-500 text-white",
    accentText: "text-sky-600",
    loginSelected: "border-sky-400 bg-sky-50",
    loginRing: "bg-sky-500",
    readStroke: "#38bdf8",
    editBanner: "bg-sky-100",
    editBannerText: "text-sky-700",
    otherBubble: "bg-white border-2 border-pink-200 shadow-sm",
    otherBubbleText: "text-slate-800",
    footerBg: "bg-sky-50 border-sky-200",
    spinner: "border-sky-500",
  },
  user2: {
    bubble: "bg-pink-400",
    bubbleText: "text-white",
    bubbleMeta: "text-pink-100",
    button: "bg-pink-500",
    buttonHover: "hover:bg-pink-600",
    buttonDisabled: "disabled:bg-pink-300",
    inputBorder: "border-pink-200",
    inputFocus: "focus:border-pink-400 focus:ring-2 focus:ring-pink-100",
    inputBg: "bg-pink-50",
    headerAvatar: "bg-pink-200 text-pink-800",
    headerBorder: "border-pink-200",
    headerBg: "bg-pink-50",
    pageBg: "bg-pink-50/80",
    userBadge: "bg-pink-500 text-white",
    accentText: "text-pink-600",
    loginSelected: "border-pink-400 bg-pink-50",
    loginRing: "bg-pink-500",
    readStroke: "#f472b6",
    editBanner: "bg-pink-100",
    editBannerText: "text-pink-700",
    otherBubble: "bg-white border-2 border-sky-200 shadow-sm",
    otherBubbleText: "text-slate-800",
    footerBg: "bg-pink-50 border-pink-200",
    spinner: "border-pink-500",
  },
};

export function getUserTheme(username: string): UserTheme {
  if (username === "user2") return THEMES.user2;
  return THEMES.user1;
}

export function getOtherUserTheme(username: string): UserTheme {
  return username === "user1" ? THEMES.user2 : THEMES.user1;
}

/** Opposite of the typist's theme: He → pink, Her → blue */
export function getTypingTheme(username: string): UserTheme {
  return username === "user2" ? THEMES.user1 : THEMES.user2;
}

/** Chat shell matches the logged-in user: He → blue, Her → pink */
export function getChatTheme(username: string): UserTheme {
  return getUserTheme(username);
}
