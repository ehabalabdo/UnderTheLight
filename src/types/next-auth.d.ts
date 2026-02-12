// NextAuth type extensions
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PARTICIPANT" | "VIEWER";
      isFrozen: boolean;
      trustScore: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PARTICIPANT" | "VIEWER";
    isFrozen: boolean;
    trustScore: number;
  }
}
