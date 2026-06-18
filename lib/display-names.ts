import { Username } from "@/lib/types";

const DISPLAY_NAMES: Record<Username, string> = {
  user1: "He",
  user2: "Her",
};

const AVATAR_LABELS: Record<Username, string> = {
  user1: "H",
  user2: "R",
};

export function getDisplayName(username: string): string {
  if (username === "user1" || username === "user2") {
    return DISPLAY_NAMES[username];
  }
  return username;
}

export function getAvatarLabel(username: string): string {
  if (username === "user1" || username === "user2") {
    return AVATAR_LABELS[username];
  }
  return username[0]?.toUpperCase() ?? "?";
}
