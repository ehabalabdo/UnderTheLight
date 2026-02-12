"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: Date;
  onComplete?: () => void;
  label?: string;
}

export function CountdownTimer({ endTime, onComplete, label }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calcTimeLeft = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calcTimeLeft());

    const interval = setInterval(() => {
      const left = calcTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-xs text-gray-500">{label}</span>}
      <div className="flex items-center gap-1 font-mono">
        <span className="bg-white/10 rounded-lg px-3 py-2 text-2xl font-bold text-amber-400">
          {String(minutes).padStart(2, "0")}
        </span>
        <span className="text-amber-400 text-2xl font-bold animate-pulse">:</span>
        <span className="bg-white/10 rounded-lg px-3 py-2 text-2xl font-bold text-amber-400">
          {String(seconds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
