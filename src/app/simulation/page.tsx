"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { SpotlightCard } from "@/components/SpotlightCard";
import Link from "next/link";

// ==========================================
//  بيانات المحاكاة
// ==========================================

const FAKE_PARTICIPANT = {
  name: "سارة",
  trustScore: 50,
};

const FAKE_QUESTIONS = [
  { id: 1, text: "ما هو أكبر سر خبّيته عن أقرب شخص إلك؟", category: "أسرار" },
  { id: 2, text: "لو قدرت ترجع بالزمن، شو أول قرار بتغيّره؟", category: "ماضي" },
  { id: 3, text: "شو أكثر إشي صعب اعترفت فيه لحدا؟", category: "شخصي" },
  { id: 4, text: "هل سبق وكذبت على شخص تحبه عشان تحميه؟", category: "مواقف" },
  { id: 5, text: "شو رأيك الحقيقي بنفسك لما تكون لحالك؟", category: "معتقدات" },
];

const FAKE_ANSWERS = [
  "إني كنت خايف أفشل بالجامعة وما حكيت لأهلي ولا مرة",
  "كان لازم ما أترك صاحبي وقت ما كان محتاجني بالمستشفى",
  "إني مرات بحس حالي ضعيف وما بقدر أعترف قدام حدا",
  "أيوا، حكيت لأمي إني مبسوط بشغلي بس الحقيقة كنت تعبان",
  "بحس إني شخص منيح بس خايف الناس تكتشف إني مش مثالي",
];

const FAKE_VIEWERS = [
  "أحمد", "لينا", "محمد", "رنا", "خالد", "نور",
  "عمر", "دانا", "يزن", "هديل", "طارق", "سلمى",
];

// ==========================================
//  المراحل
// ==========================================

type Phase =
  | "intro"
  | "participant_enters"
  | "question_reveal"
  | "answering"
  | "answer_shown"
  | "next_question"
  | "voting"
  | "vote_animation"
  | "result"
  | "end";

// ==========================================
//  المكوّن الرئيسي
// ==========================================

export default function SimulationPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [votes, setVotes] = useState<{ truthful: number; liar: number }>({ truthful: 0, liar: 0 });
  const [userVote, setUserVote] = useState<"truthful" | "liar" | null>(null);
  const [trustScore, setTrustScore] = useState(50);
  const [viewerReactions, setViewerReactions] = useState<string[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);

  // تأثير وميض الـ cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  //  تأثير الكتابة التلقائية
  // ==========================================
  const typeAnswer = useCallback((text: string, onDone: () => void) => {
    setTypedAnswer("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setTypedAnswer(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(onDone, 800);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  //  بدء المحاكاة
  // ==========================================
  const startSimulation = () => {
    setPhase("participant_enters");
    setTimeout(() => {
      setPhase("question_reveal");
      setTimeout(() => {
        setPhase("answering");
        typeAnswer(FAKE_ANSWERS[0], () => {
          setPhase("answer_shown");
          setAnsweredCount(1);
        });
      }, 2000);
    }, 2500);
  };

  // ==========================================
  //  الانتقال للسؤال التالي
  // ==========================================
  const nextQuestion = () => {
    const next = currentQ + 1;
    if (next < 5) {
      setCurrentQ(next);
      setTypedAnswer("");
      setPhase("question_reveal");
      setTimeout(() => {
        setPhase("answering");
        typeAnswer(FAKE_ANSWERS[next], () => {
          setPhase("answer_shown");
          setAnsweredCount(next + 1);
        });
      }, 1500);
    } else {
      // انتهت الأسئلة → مرحلة التصويت
      setPhase("voting");
      setUserVote(null);
      // بدء تصويت المشاهدين الوهميين
      simulateViewerVotes();
    }
  };

  // ==========================================
  //  محاكاة تصويت المشاهدين
  // ==========================================
  const simulateViewerVotes = () => {
    let t = 0;
    let truthful = 0;
    let liar = 0;
    const viewers = [...FAKE_VIEWERS];

    const interval = setInterval(() => {
      if (t >= viewers.length) {
        clearInterval(interval);
        return;
      }
      const isTruthful = Math.random() > 0.35;
      if (isTruthful) truthful++;
      else liar++;
      setVotes({ truthful, liar });

      const name = viewers[t];
      setViewerReactions((prev) => [
        ...prev.slice(-4),
        `${name} صوّت: ${isTruthful ? "صادق ✅" : "كاذب ❌"}`,
      ]);

      // إيموجي طائر
      setFloatingEmojis((prev) => [
        ...prev,
        { id: Date.now(), emoji: isTruthful ? "✅" : "❌", x: 20 + Math.random() * 60 },
      ]);

      t++;
    }, 400);
  };

  // ==========================================
  //  تصويت المستخدم (الزائر)
  // ==========================================
  const handleUserVote = (vote: "truthful" | "liar") => {
    setUserVote(vote);
    const isTruthful = vote === "truthful";
    setVotes((prev) => ({
      truthful: prev.truthful + (isTruthful ? 1 : 0),
      liar: prev.liar + (isTruthful ? 0 : 1),
    }));

    setFloatingEmojis((prev) => [
      ...prev,
      { id: Date.now(), emoji: isTruthful ? "✅" : "❌", x: 50 },
    ]);

    // بعد ثانيتين نعرض النتيجة
    setTimeout(() => {
      const total = votes.truthful + votes.liar + 1;
      const truthfulCount = votes.truthful + (isTruthful ? 1 : 0);
      const newScore = Math.round((truthfulCount / total) * 100);
      setTrustScore(newScore);
      setPhase("result");
    }, 2500);
  };

  // ==========================================
  //  حذف الإيموجي القديمة
  // ==========================================
  useEffect(() => {
    if (floatingEmojis.length > 0) {
      const timeout = setTimeout(() => {
        setFloatingEmojis((prev) => prev.slice(1));
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [floatingEmojis]);

  // ==========================================
  //  الرندر
  // ==========================================
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* خلفية الضوء */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[250px] h-[700px] bg-gradient-to-b from-amber-400/20 via-yellow-500/5 to-transparent pointer-events-none"
          style={{ clipPath: "polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)" }}
        />

        {/* إيموجي طائرة */}
        {floatingEmojis.map((e) => (
          <span
            key={e.id}
            className="absolute text-2xl animate-float-up pointer-events-none"
            style={{ left: `${e.x}%`, bottom: "20%" }}
          >
            {e.emoji}
          </span>
        ))}

        <div className="relative z-10 w-full max-w-2xl">
          {/* ========== مرحلة المقدمة ========== */}
          {phase === "intro" && (
            <div className="text-center animate-fadeIn">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-black text-3xl">👁️</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-4 text-white">
                شو يعني <span className="text-amber-400">تحت الضوء</span>؟
              </h1>
              <p className="text-gray-400 mb-3 text-lg leading-relaxed max-w-md mx-auto">
                كل جلسة، شخص واحد يطلع قدام الجمهور.
                <br />
                يجاوب على <span className="text-amber-400 font-bold">5 أسئلة مفاجئة</span> بصراحة.
              </p>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                الجمهور يقرأ إجاباته ويصوّت: <span className="text-green-400 font-semibold">صادق</span> أو <span className="text-red-400 font-semibold">كاذب</span>؟
              </p>

              <div className="flex flex-col gap-3 items-center">
                <button
                  onClick={startSimulation}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-amber-500/30"
                >
                  شاهد المحاكاة 🎬
                </button>
                <Link href="/" className="text-sm text-gray-600 hover:text-gray-400 transition">
                  ← ارجع للصفحة الرئيسية
                </Link>
              </div>

              {/* خطوات مختصرة */}
              <div className="mt-12 grid grid-cols-4 gap-2 text-center">
                {[
                  { icon: "🎤", label: "يطلع تحت الضوء" },
                  { icon: "❓", label: "5 أسئلة مفاجئة" },
                  { icon: "✍️", label: "يجاوب بصراحة" },
                  { icon: "🗳️", label: "الجمهور يصوّت" },
                ].map((step, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-2xl mb-1">{step.icon}</div>
                    <p className="text-xs text-gray-500">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== منطقة اللعب ========== */}
          {phase !== "intro" && phase !== "end" && (
            <div className="animate-fadeIn">
              {/* شريط علوي: المعلومات */}
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm">
                    {FAKE_PARTICIPANT.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{FAKE_PARTICIPANT.name}</p>
                    <p className="text-xs text-gray-500">تحت الضوء الآن</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-amber-400 font-mono font-bold">{answeredCount}/5</p>
                    <p className="text-[10px] text-gray-600">أسئلة</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-300 font-mono font-bold">{FAKE_VIEWERS.length + 1}</p>
                    <p className="text-[10px] text-gray-600">مشاهد</p>
                  </div>
                </div>
              </div>

              {/* شريط التقدم */}
              <div className="flex gap-1.5 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      i < answeredCount
                        ? "bg-amber-500"
                        : i === currentQ
                        ? "bg-amber-500/40 animate-pulse"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              <SpotlightCard>
                {/* ---- المشارك يدخل ---- */}
                {phase === "participant_enters" && (
                  <div className="text-center py-8 animate-fadeIn">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center animate-pulse shadow-lg shadow-amber-500/40">
                      <span className="text-black text-3xl font-black">{FAKE_PARTICIPANT.name[0]}</span>
                    </div>
                    <p className="text-xl font-bold text-white mb-1">
                      <span className="text-amber-400">{FAKE_PARTICIPANT.name}</span> طلعت تحت الضوء
                    </p>
                    <p className="text-gray-500 text-sm">جاري تحضير الأسئلة...</p>
                    <div className="mt-4 flex justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {/* ---- كشف السؤال ---- */}
                {phase === "question_reveal" && (
                  <div className="text-center py-8 animate-fadeIn">
                    <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold mb-4">
                      {FAKE_QUESTIONS[currentQ].category} • سؤال {currentQ + 1} من 5
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-white leading-relaxed animate-slideDown">
                      {FAKE_QUESTIONS[currentQ].text}
                    </p>
                    <p className="text-gray-600 text-sm mt-4">
                      {FAKE_PARTICIPANT.name} تكتب الإجابة...
                    </p>
                  </div>
                )}

                {/* ---- الكتابة ---- */}
                {phase === "answering" && (
                  <div className="py-4 animate-fadeIn">
                    <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold mb-4">
                      {FAKE_QUESTIONS[currentQ].category} • سؤال {currentQ + 1} من 5
                    </div>
                    <p className="text-lg font-bold text-white mb-6">
                      {FAKE_QUESTIONS[currentQ].text}
                    </p>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 min-h-[80px]">
                      <p className="text-gray-300 leading-relaxed">
                        {typedAnswer}
                        {showCursor && <span className="text-amber-400 animate-pulse">|</span>}
                      </p>
                    </div>
                    <div className="flex justify-between mt-3 text-xs text-gray-600">
                      <span>{typedAnswer.length}/150 حرف</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        مباشر
                      </span>
                    </div>
                  </div>
                )}

                {/* ---- الإجابة ظهرت ---- */}
                {phase === "answer_shown" && (
                  <div className="py-4 animate-fadeIn">
                    <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold mb-4">
                      {FAKE_QUESTIONS[currentQ].category} • سؤال {currentQ + 1} من 5
                    </div>
                    <p className="text-lg font-bold text-white mb-4">
                      {FAKE_QUESTIONS[currentQ].text}
                    </p>
                    <div className="bg-black/50 border border-amber-500/30 rounded-xl p-4">
                      <p className="text-white leading-relaxed">{FAKE_ANSWERS[currentQ]}</p>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-xs text-gray-600">
                        ✅ تم إرسال الإجابة
                      </p>
                      <button
                        onClick={nextQuestion}
                        className="px-5 py-2 rounded-full bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition"
                      >
                        {currentQ < 4 ? "السؤال التالي ←" : "انتقل للتصويت 🗳️"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ---- مرحلة التصويت ---- */}
                {phase === "voting" && (
                  <div className="py-4 animate-fadeIn">
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-500 mb-1">انتهت الأسئلة</p>
                      <h2 className="text-2xl font-black text-white">
                        هل <span className="text-amber-400">{FAKE_PARTICIPANT.name}</span> كانت صادقة؟
                      </h2>
                    </div>

                    {/* ملخص الإجابات */}
                    <div className="space-y-3 mb-6 max-h-48 overflow-y-auto scrollbar-thin">
                      {FAKE_QUESTIONS.map((q, i) => (
                        <div key={i} className="bg-black/40 rounded-lg p-3 border border-white/5">
                          <p className="text-xs text-amber-400/70 mb-1">{q.text}</p>
                          <p className="text-sm text-gray-300">{FAKE_ANSWERS[i]}</p>
                        </div>
                      ))}
                    </div>

                    {/* أزرار التصويت */}
                    {!userVote ? (
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleUserVote("truthful")}
                          className="flex-1 py-4 rounded-xl bg-green-500/20 border-2 border-green-500/40 text-green-400 font-bold text-lg hover:bg-green-500/30 hover:border-green-500/60 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          صادقة ✅
                        </button>
                        <button
                          onClick={() => handleUserVote("liar")}
                          className="flex-1 py-4 rounded-xl bg-red-500/20 border-2 border-red-500/40 text-red-400 font-bold text-lg hover:bg-red-500/30 hover:border-red-500/60 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          كاذبة ❌
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-gray-400">
                          صوّتت: {userVote === "truthful" ? "صادقة ✅" : "كاذبة ❌"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">جاري حساب التصويت...</p>
                      </div>
                    )}

                    {/* شريط التصويت المباشر */}
                    {(votes.truthful > 0 || votes.liar > 0) && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>صادق ({votes.truthful})</span>
                          <span>كاذب ({votes.liar})</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-500 transition-all duration-500"
                            style={{
                              width: `${(votes.truthful / (votes.truthful + votes.liar)) * 100}%`,
                            }}
                          />
                          <div
                            className="bg-red-500 transition-all duration-500"
                            style={{
                              width: `${(votes.liar / (votes.truthful + votes.liar)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* ردود المشاهدين */}
                    {viewerReactions.length > 0 && (
                      <div className="mt-4 space-y-1">
                        {viewerReactions.map((r, i) => (
                          <p key={i} className="text-xs text-gray-600 animate-fadeIn">
                            {r}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ---- النتيجة ---- */}
                {phase === "result" && (
                  <div className="text-center py-6 animate-fadeIn">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
                      <span className="text-black text-2xl font-black">{trustScore}%</span>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">
                      نتيجة المصداقية
                    </h2>
                    <p className="text-gray-400 mb-6">
                      <span className="text-amber-400 font-bold">{votes.truthful}</span> صوّتوا صادق
                      {" • "}
                      <span className="text-red-400 font-bold">{votes.liar}</span> صوّتوا كاذب
                    </p>

                    <div className="bg-black/40 rounded-xl p-4 border border-white/10 mb-6 text-right">
                      <p className="text-sm text-gray-400 leading-relaxed">
                        <span className="text-amber-400 font-bold">نقاط الثقة (TrustScore)</span> هي نسبة
                        الأصوات اللي حكمت إنك صادق. كل ما طلعت تحت الضوء أكثر، كل ما صارت
                        نتيجتك أدق.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        ⚠️ إذا نقاط ثقتك نزلت تحت 10% بعد 3 ظهورات - حسابك بيتجمّد!
                      </p>
                    </div>

                    <button
                      onClick={() => setPhase("end")}
                      className="px-8 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-amber-500/30"
                    >
                      فهمت! ←
                    </button>
                  </div>
                )}
              </SpotlightCard>
            </div>
          )}

          {/* ========== الخاتمة ========== */}
          {phase === "end" && (
            <div className="text-center animate-fadeIn">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <span className="text-white text-3xl">🎉</span>
              </div>
              <h2 className="text-3xl font-black text-white mb-3">
                هيك بتشتغل <span className="text-amber-400">تحت الضوء</span>!
              </h2>
              <p className="text-gray-400 mb-2 max-w-md mx-auto">
                سجّل الآن وانضم. ممكن تكون مشارك أو مشاهد.
              </p>
              <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto">
                كمشارك - بتطلع تحت الضوء وتجاوب بصراحة.
                <br />
                كمشاهد - بتشوف الإجابات وبتصوّت.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-amber-500/30"
                >
                  سجّل الآن 🚀
                </Link>
                <Link
                  href="/"
                  className="px-8 py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition"
                >
                  الصفحة الرئيسية
                </Link>
              </div>

              {/* ملخص القواعد */}
              <div className="mt-12 grid grid-cols-2 gap-3 text-right max-w-md mx-auto">
                {[
                  { icon: "📝", title: "5 أسئلة", desc: "عشوائية من بنك أسئلة متنوع" },
                  { icon: "⏱️", title: "150 حرف", desc: "لكل إجابة، بدون تعديل بعد الإرسال" },
                  { icon: "👥", title: "80 مشاهد", desc: "بكل جلسة يشاهدون ويصوّتون" },
                  { icon: "🔒", title: "تجميد الحساب", desc: "إذا نقاط الثقة أقل من 10%" },
                ].map((rule, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xl mb-1">{rule.icon}</div>
                    <p className="text-sm font-bold text-amber-400">{rule.title}</p>
                    <p className="text-xs text-gray-600">{rule.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
