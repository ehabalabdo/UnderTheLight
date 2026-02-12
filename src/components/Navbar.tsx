"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
            <span className="text-black text-sm font-bold">U</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            UnderTheLight
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-white transition"
              >
                الرئيسية
              </Link>
              <Link
                href="/profile"
                className="text-sm text-gray-400 hover:text-white transition"
              >
                ملفي
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {session.user?.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  {(session.user as any)?.role === "PARTICIPANT"
                    ? "مشارك"
                    : "مشاهد"}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                خروج
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-400 hover:text-white transition"
              >
                دخول
              </Link>
              <Link
                href="/register"
                className="text-sm px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-medium hover:opacity-90 transition"
              >
                انضم الآن
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
