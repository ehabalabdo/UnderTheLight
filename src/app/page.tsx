import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Background spotlight effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[800px] bg-gradient-to-b from-amber-400/20 via-yellow-500/5 to-transparent" 
          style={{ clipPath: "polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)" }} />

        <div className="relative z-10 text-center max-w-2xl">
          {/* Logo */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <span className="text-black text-4xl font-black">U</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent">
            Under The Light
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-2">
            تحت الضوء
          </p>
          
          <p className="text-gray-500 mb-12 max-w-md mx-auto leading-relaxed">
            اطلع تحت الضوء. جاوب بصدق. خلّي الجمهور يحكم.
            <br />
            <span className="text-amber-500/80">5 أسئلة. 150 حرف. بدون تعديل.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-lg hover:opacity-90 transition shadow-lg shadow-amber-500/30"
            >
              انضم الآن
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 rounded-full border border-white/20 text-white font-medium text-lg hover:bg-white/5 transition"
            >
              دخول
            </Link>
          </div>

          {/* رابط المحاكاة */}
          <div className="mt-6">
            <Link
              href="/simulation"
              className="inline-flex items-center gap-2 text-amber-400/70 hover:text-amber-400 transition text-sm"
            >
              <span>🎬</span>
              <span>أول مرة هنا؟ شاهد كيف يعمل الموقع</span>
              <span>←</span>
            </Link>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-bold text-amber-400 mb-1">5 أسئلة مفاجئة</h3>
              <p className="text-sm text-gray-500">أسئلة عشوائية من فئات مختلفة</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold text-amber-400 mb-1">كشف مباشر</h3>
              <p className="text-sm text-gray-500">الإجابات تظهر فوراً للجمهور</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-3xl mb-3">🗳️</div>
              <h3 className="font-bold text-amber-400 mb-1">صادق أم كاذب؟</h3>
              <p className="text-sm text-gray-500">الجمهور يصوّت على مصداقيتك</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
