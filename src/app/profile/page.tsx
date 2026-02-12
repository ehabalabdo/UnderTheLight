"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SpotlightCard } from "@/components/SpotlightCard";

interface ProfileData {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    trustScore: number;
    lastAppearanceDate: string | null;
    isFrozen: boolean;
    appearanceCount: number;
    createdAt: string;
    _count: { sessions: number; votes: number };
  };
  sessions: {
    id: string;
    startedAt: string;
    endedAt: string;
    trustResult: number;
    totalVotes: number;
    trueVotes: number;
    falseVotes: number;
  }[];
}

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then(setProfile)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-amber-400">جاري التحميل...</div>
        </main>
      </>
    );
  }

  if (!profile?.user) return null;

  const { user, sessions } = profile;
  const daysUntilNextAppearance = user.lastAppearanceDate
    ? Math.max(
        0,
        30 -
          Math.floor(
            (Date.now() - new Date(user.lastAppearanceDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
      )
    : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 px-4 pb-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px]" />

        <div className="max-w-2xl mx-auto relative z-10 space-y-6">
          {/* Profile Header */}
          <SpotlightCard>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-3xl font-black text-black">
                {user.username[0].toUpperCase()}
              </div>
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              <div className="flex justify-center gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                  {user.role === "PARTICIPANT" ? "مشارك" : "مشاهد"}
                </span>
                {user.isFrozen && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                    مجمّد ❄️
                  </span>
                )}
              </div>
            </div>
          </SpotlightCard>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {user.trustScore.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">نسبة الثقة</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {user.appearanceCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">مرات الظهور</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {user._count.votes}
              </div>
              <div className="text-xs text-gray-500 mt-1">تصويتاتي</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {daysUntilNextAppearance}
              </div>
              <div className="text-xs text-gray-500 mt-1">يوم للظهور القادم</div>
            </div>
          </div>

          {/* Session History */}
          {sessions.length > 0 && (
            <SpotlightCard>
              <h2 className="text-lg font-bold mb-4">سجل الجلسات</h2>
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  >
                    <div>
                      <p className="text-sm text-gray-300">
                        {s.startedAt
                          ? new Date(s.startedAt).toLocaleDateString("ar-SA")
                          : "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {s.totalVotes} صوت
                      </p>
                    </div>
                    <div className="text-left">
                      <span
                        className={`text-lg font-bold ${
                          (s.trustResult || 0) >= 50
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {(s.trustResult || 0).toFixed(1)}%
                      </span>
                      <div className="text-[10px] text-gray-500">
                        ✓ {s.trueVotes} · ✗ {s.falseVotes}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          )}
        </div>
      </main>
    </>
  );
}
