"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SpotlightCard } from "@/components/SpotlightCard";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    role: "PARTICIPANT" as "PARTICIPANT" | "VIEWER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("حدث خطأ في إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center px-4 py-20 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />

        <SpotlightCard className="w-full max-w-md relative z-10">
          <h1 className="text-2xl font-bold text-center mb-8">
            إنشاء حساب جديد
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition"
                placeholder="اسم المستخدم"
                required
                minLength={3}
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition"
                placeholder="email@example.com"
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                كلمة المرور
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition"
                placeholder="6 أحرف على الأقل"
                required
                minLength={6}
                dir="ltr"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-3">
                اختر دورك
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "PARTICIPANT" })}
                  className={`p-4 rounded-xl border text-center transition ${
                    form.role === "PARTICIPANT"
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <div className="text-2xl mb-1">🎤</div>
                  <div className="font-bold text-sm">مشارك</div>
                  <div className="text-[10px] mt-1 text-gray-500">
                    اطلع تحت الضوء + صوّت
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "VIEWER" })}
                  className={`p-4 rounded-xl border text-center transition ${
                    form.role === "VIEWER"
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <div className="text-2xl mb-1">👁️</div>
                  <div className="font-bold text-sm">مشاهد</div>
                  <div className="text-[10px] mt-1 text-gray-500">
                    شاهد وصوّت فقط
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            عندك حساب؟{" "}
            <Link href="/login" className="text-amber-400 hover:underline">
              سجّل دخول
            </Link>
          </p>
        </SpotlightCard>
      </main>
    </>
  );
}
