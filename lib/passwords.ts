import { Username } from "@/lib/types";

export function verifyUserPassword(username: Username, password: string): boolean {
  const expected =
    username === "user1"
      ? process.env.USER1_PASSWORD
      : process.env.USER2_PASSWORD;

  if (!expected) {
    return false;
  }

  return password === expected;
}

export function passwordsConfigured(): boolean {
  return Boolean(process.env.USER1_PASSWORD && process.env.USER2_PASSWORD);
}
