"use client";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Spotlight glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-transparent rounded-2xl blur-xl" />
      <div className="relative bg-gray-950/80 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
