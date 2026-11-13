"use client";

import { CompanionArt } from "@/components/companion/companion";

export function AuthIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-[0_20px_60px_rgba(80,100,140,0.15)] backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#8b97ad]">Today</p>
            <p className="font-display text-lg font-bold text-[#3b4a63]">3 of 5 done</p>
          </div>
          <div className="rounded-2xl bg-[#E6F0FA] px-3 py-2 text-center">
            <p className="font-display text-xl font-extrabold tabular-nums text-[#4A78A8]">24:59</p>
            <p className="text-[10px] font-semibold text-[#6a8bb0]">Focus</p>
          </div>
        </div>
        {["Morning reading", "Finish project draft", "Evening walk"].map((t, i) => (
          <div key={t} className="mb-2 flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2.5">
            <span className={`grid size-5 place-items-center rounded-full border-2 ${i === 0 ? "border-[#A9D6B0] bg-[#A9D6B0]" : "border-[#d6dbe5]"}`}>
              {i === 0 && (
                <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M2.5 6.5 5 9l4.5-6" />
                </svg>
              )}
            </span>
            <span className={`text-sm font-semibold ${i === 0 ? "text-[#9aa3b3] line-through" : "text-[#3b4a63]"}`}>{t}</span>
          </div>
        ))}
      </div>
      <div className="absolute -bottom-10 -right-6">
        <CompanionArt type="cat" mood="focus" size={130} accessory="scarf" />
      </div>
    </div>
  );
}
