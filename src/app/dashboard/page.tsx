"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { SpotlightCard } from "@/components/SpotlightCard";


interface SessionData {
  type: "participant" | "viewer" | "waiting" | "no_session";
  session?: any;
  hasVoted?: boolean;
  vote?: string | null;
  message?: string;
  activeUsers?: number;
  activeSessions?: number;
  minUsersNeeded?: number;
  assigned?: boolean;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessionData(data);

      if (data.assigned) {
        // Re-fetch after assignment
        setTimeout(fetchSession, 1000);
      }

      // Find current unanswered question
      if (data.type === "participant" && data.session?.answers) {
        const idx = data.session.answers.findIndex(
          (a: any) => a.text === ""
        );
        if (idx >= 0) setCurrentQuestionIndex(idx);
      }
    } catch {
      setError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchSession();
      // Poll every 10 seconds
      const interval = setInterval(fetchSession, 10000);
      return () => clearInterval(interval);
    }
  }, [status, router, fetchSession]);

  const submitAnswer = async () => {
    if (!sessionData?.session || !answerText.trim()) return;
    setSubmitting(true);
    setError("");

    const answer = sessionData.session.answers[currentQuestionIndex];

    try {
      const res = await fetch("/api/sessions/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.session.id,
          questionId: answer.questionId,
          text: answerText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setAnswerText("");
      setCurrentQuestionIndex((prev) => prev + 1);
      await fetchSession();
    } catch {
      setError("حدث خطأ في إرسال الإجابة");
    } finally {
      setSubmitting(false);
    }
  };

  const submitVote = async (vote: "TRUE" | "FALSE") => {
    if (!sessionData?.session) return;
    setVoting(true);
    setError("");

    try {
      const res = await fetch("/api/sessions/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.session.id,
          vote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      await fetchSession();
    } catch {
      setError("حدث خطأ في التصويت");
    } finally {
      setVoting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-amber-400 text-xl">
            جاري التحميل...
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 px-4 pb-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px]" />

        <div className="max-w-2xl mx-auto relative z-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* No Session Available */}
          {sessionData?.type === "no_session" && (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">💡</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-300">
                لا توجد جلسات نشطة حالياً
              </h2>
              <p className="text-gray-500 mb-8">
                الجلسة القادمة تبدأ لما يوصل العدد الكافي من المستخدمين
              </p>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">
                    {sessionData.activeUsers || 0}
                  </div>
                  <div className="text-xs text-gray-500">متصل الآن</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">
                    {sessionData.minUsersNeeded || 40}
                  </div>
                  <div className="text-xs text-gray-500">المطلوب</div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-6 max-w-xs mx-auto">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        ((sessionData.activeUsers || 0) /
                          (sessionData.minUsersNeeded || 40)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Waiting state */}
          {sessionData?.type === "waiting" && (
            <div className="text-center py-20">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-gray-400">جاري تحميل الجلسة...</p>
            </div>
          )}

          {/* === PARTICIPANT VIEW === */}
          {sessionData?.type === "participant" && sessionData.session && (
            <div>
              {/* Spotlight header */}
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold mb-4">
                  🔦 أنت تحت الضوء الآن
                </div>
                <h2 className="text-xl font-bold">
                  جاوب على الأسئلة بصدق - 150 حرف لكل إجابة
                </h2>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {sessionData.session.answers.map((answer: any, idx: number) => (
                  <SpotlightCard key={answer.id} className="w-full">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          answer.text
                            ? "bg-green-500/20 text-green-400"
                            : idx === currentQuestionIndex
                            ? "bg-amber-500/20 text-amber-400 animate-pulse"
                            : "bg-white/10 text-gray-500"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-gray-300 mb-3">
                          {answer.question?.text || "سؤال..."}
                        </p>

                        {answer.text ? (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
                            {answer.text}
                          </div>
                        ) : idx === currentQuestionIndex ? (
                          <div className="space-y-2">
                            <textarea
                              value={answerText}
                              onChange={(e) => {
                                if (e.target.value.length <= 150)
                                  setAnswerText(e.target.value);
                              }}
                              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-amber-500/30 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60 resize-none transition"
                              placeholder="اكتب إجابتك هنا..."
                              rows={2}
                              maxLength={150}
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                {answerText.length}/150
                              </span>
                              <button
                                onClick={submitAnswer}
                                disabled={
                                  submitting || answerText.trim().length === 0
                                }
                                className="px-6 py-2 rounded-lg bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition disabled:opacity-50"
                              >
                                {submitting ? "جاري الإرسال..." : "أرسل"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-white/5 text-gray-600 text-sm">
                            بانتظار الإجابة...
                          </div>
                        )}
                      </div>
                    </div>
                  </SpotlightCard>
                ))}
              </div>

              {/* Status */}
              {sessionData.session.status === "VOTING" && (
                <div className="text-center mt-8 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="text-3xl mb-2">🗳️</div>
                  <p className="text-blue-300 font-bold">
                    أجبت على كل الأسئلة! الجمهور يصوّت الآن...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    الأصوات حتى الآن: {sessionData.session._count?.votes || 0}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* === VIEWER VIEW === */}
          {sessionData?.type === "viewer" && sessionData.session && (
            <div>
              {/* Session header */}
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-gray-300 text-sm font-medium mb-4">
                  👁️ أنت تشاهد جلسة مباشرة
                </div>
                <h2 className="text-xl font-bold">
                  <span className="text-amber-400">
                    {sessionData.session.participant?.username}
                  </span>{" "}
                  تحت الضوء
                </h2>
                {sessionData.session.participant?.trustScore !== undefined && (
                  <p className="text-sm text-gray-500 mt-1">
                    نسبة الثقة:{" "}
                    <span className="text-amber-400">
                      {sessionData.session.participant.trustScore.toFixed(1)}%
                    </span>
                    {" · "}
                    ظهر {sessionData.session.participant.appearanceCount || 0}{" "}
                    مرة
                  </p>
                )}
              </div>

              {/* Answers reveal */}
              <div className="space-y-4">
                {sessionData.session.answers?.map(
                  (answer: any, idx: number) => (
                    <SpotlightCard key={answer.id} className="w-full">
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            answer.text && answer.revealedAt
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-white/10 text-gray-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-300 mb-2">
                            {answer.question?.text || "سؤال..."}
                          </p>
                          {answer.text && answer.revealedAt ? (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
                              {answer.text}
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-white/5 text-gray-600 text-sm animate-pulse">
                              بانتظار الإجابة...
                            </div>
                          )}
                        </div>
                      </div>
                    </SpotlightCard>
                  )
                )}
              </div>

              {/* Voting section */}
              {sessionData.session.status === "VOTING" && (
                <div className="mt-8">
                  {sessionData.hasVoted ? (
                    <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="text-gray-300 font-bold">
                        صوّتت:{" "}
                        <span
                          className={
                            sessionData.vote === "TRUE"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {sessionData.vote === "TRUE" ? "صادق" : "كاذب"}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        إجمالي الأصوات:{" "}
                        {sessionData.session._count?.votes || 0}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-8 rounded-xl bg-white/5 border border-white/10">
                      <h3 className="text-lg font-bold mb-2">
                        هل كان صادقاً؟
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        صوّت بناءً على إجاباته
                      </p>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => submitVote("TRUE")}
                          disabled={voting}
                          className="px-8 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-bold hover:bg-green-500/30 transition disabled:opacity-50"
                        >
                          ✓ صادق
                        </button>
                        <button
                          onClick={() => submitVote("FALSE")}
                          disabled={voting}
                          className="px-8 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/30 transition disabled:opacity-50"
                        >
                          ✗ كاذب
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Waiting for answers */}
              {sessionData.session.status === "IN_PROGRESS" && (
                <div className="text-center mt-8 p-4 rounded-xl bg-white/5">
                  <p className="text-gray-400 text-sm animate-pulse">
                    المشارك يجيب على الأسئلة... الإجابات تظهر مباشرة
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
