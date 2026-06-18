import { Username } from "@/lib/types";

export function verifyUserPassword(username: Username, password: string): boolean {
  const expected =
    username === "user1"
      ? process.env.USER1_PASSWORD?.trim()
      : process.env.USER2_PASSWORD?.trim();

  if (!expected) {
    return false;
  }

  return password === expected;
}

export function passwordsConfigured(): boolean {
  return Boolean(
    process.env.USER1_PASSWORD?.trim() && process.env.USER2_PASSWORD?.trim()
  );
}
