"use client";

import * as React from "react";

/** Original illustrated wallpapers, drawn as SVG so they're crisp, tiny, and license-free. */

export type WallpaperCategory = "Cozy room" | "Minimal" | "Nature" | "Sky" | "Pastel" | "Study room" | "Seasonal";

export interface Wallpaper {
  id: string;
  name: string;
  category: WallpaperCategory;
  dark?: boolean;
}

export const WALLPAPERS: Wallpaper[] = [
  { id: "none", name: "Plain", category: "Minimal" },
  { id: "soft-glow", name: "Soft Glow", category: "Minimal" },
  { id: "paper", name: "Dotted Paper", category: "Minimal" },
  { id: "pastel-waves", name: "Pastel Waves", category: "Pastel" },
  { id: "clouds", name: "Daydream Clouds", category: "Sky" },
  { id: "sunset", name: "Peach Sunset", category: "Sky" },
  { id: "night", name: "Starry Night", category: "Sky", dark: true },
  { id: "meadow", name: "Quiet Meadow", category: "Nature" },
  { id: "forest", name: "Misty Forest", category: "Nature" },
  { id: "cozy-room", name: "Moonlit Room", category: "Cozy room", dark: true },
  { id: "rainy-window", name: "Rainy Window", category: "Study room", dark: true },
  { id: "desk", name: "Morning Desk", category: "Study room" },
  { id: "sakura", name: "Sakura Breeze", category: "Seasonal" },
  { id: "snow", name: "First Snow", category: "Seasonal" },
];

export const wallpaperById = (id: string) => WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];

const S = { width: "100%", height: "100%", display: "block" } as const;

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function Stars({ count = 60, seed = 7, h = 600 }: { count?: number; seed?: number; h?: number }) {
  const r = rand(seed);
  return (
    <g fill="#fff">
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={r() * 1200}
          cy={r() * h}
          r={r() * 1.4 + 0.3}
          opacity={0.4 + r() * 0.6}
          className={i % 4 === 0 ? "animate-twinkle" : undefined}
          style={{ animationDelay: `${(i % 7) * 0.4}s` }}
        />
      ))}
    </g>
  );
}

function Cloud({ x, y, s = 1, fill = "#fff", opacity = 0.9 }: { x: number; y: number; s?: number; fill?: string; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} opacity={opacity}>
      <ellipse cx="0" cy="20" rx="70" ry="22" />
      <circle cx="-25" cy="5" r="28" />
      <circle cx="15" cy="-5" r="36" />
      <circle cx="48" cy="10" r="24" />
    </g>
  );
}

export function WallpaperArt({ id, className }: { id: string; className?: string }) {
  const art = (() => {
    switch (id) {
      case "soft-glow":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <defs>
              <radialGradient id="g1" cx="20%" cy="15%" r="60%">
                <stop offset="0" stopColor="var(--glow-1)" />
                <stop offset="1" stopColor="var(--glow-1)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="g2" cx="85%" cy="80%" r="55%">
                <stop offset="0" stopColor="var(--glow-2)" />
                <stop offset="1" stopColor="var(--glow-2)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="800" fill="var(--bg)" />
            <rect width="1200" height="800" fill="url(#g1)" />
            <rect width="1200" height="800" fill="url(#g2)" />
          </svg>
        );
      case "paper":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <defs>
              <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="var(--line)" />
              </pattern>
            </defs>
            <rect width="1200" height="800" fill="var(--bg)" />
            <rect width="1200" height="800" fill="url(#dots)" />
          </svg>
        );
      case "pastel-waves":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <rect width="1200" height="800" fill="#FBF8F4" />
            <path d="M0 520 C 250 440 450 600 700 520 S 1050 430 1200 500 V800 H0Z" fill="#E6F0FA" />
            <path d="M0 600 C 300 540 500 680 800 600 S 1100 560 1200 600 V800 H0Z" fill="#F0E9FA" />
            <path d="M0 690 C 280 640 560 760 860 690 S 1120 660 1200 690 V800 H0Z" fill="#FBEAF0" />
            <circle cx="980" cy="180" r="70" fill="#FDEEE3" />
          </svg>
        );
      case "clouds":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#D8E8F7" />
                <stop offset="1" stopColor="#F6F1FA" />
              </linearGradient>
            </defs>
            <rect width="1200" height="800" fill="url(#sky)" />
            <g className="animate-float">
              <Cloud x={180} y={160} s={1.2} />
              <Cloud x={820} y={110} s={0.9} opacity={0.8} />
            </g>
            <Cloud x={560} y={330} s={1.5} opacity={0.75} />
            <Cloud x={1050} y={420} s={1.1} opacity={0.85} />
            <Cloud x={120} y={560} s={1.6} opacity={0.9} />
            <Cloud x={700} y={660} s={2} opacity={0.95} />
          </svg>
        );
      case "sunset":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <defs>
              <linearGradient id="ss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#F9DCCB" />
                <stop offset="0.55" stopColor="#FBE6E4" />
                <stop offset="1" stopColor="#F3E3F3" />
              </linearGradient>
            </defs>
            <rect width="1200" height="800" fill="url(#ss)" />
            <circle cx="600" cy="520" r="120" fill="#FCEBD9" />
            <path d="M0 560 Q 300 500 600 560 T 1200 540 V800 H0Z" fill="#F2D3D8" opacity="0.8" />
            <path d="M0 640 Q 350 590 700 650 T 1200 630 V800 H0Z" fill="#E9CFE3" opacity="0.8" />
            <Cloud x={250} y={200} s={0.8} fill="#FFF6F0" />
            <Cloud x={950} y={260} s={0.7} fill="#FFF6F0" />
          </svg>
        );
      case "night":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <defs>
              <linearGradient id="ns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1B1E36" />
                <stop offset="1" stopColor="#3A3561" />
              </linearGradient>
            </defs>
            <rect width="1200" height="800" fill="url(#ns)" />
            <Stars count={110} />
            <circle cx="930" cy="170" r="54" fill="#F6EFD9" />
            <circle cx="952" cy="155" r="54" fill="#23264A" opacity="0.9" />
            <path d="M0 650 Q 300 590 600 650 T 1200 630 V800 H0Z" fill="#2A2C50" />
            <path d="M0 710 Q 400 660 800 720 T 1200 700 V800 H0Z" fill="#22243F" />
          </svg>
        );
      case "meadow":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <rect width="1200" height="800" fill="#EEF5F0" />
            <circle cx="260" cy="180" r="60" fill="#FFF3D6" />
            <Cloud x={800} y={160} s={0.8} />
            <path d="M0 500 Q 300 420 650 500 T 1200 470 V800 H0Z" fill="#D7E8D5" />
            <path d="M0 590 Q 400 520 800 600 T 1200 570 V800 H0Z" fill="#C4DEC2" />
            <path d="M0 680 Q 350 630 700 690 T 1200 670 V800 H0Z" fill="#B3D3B1" />
            {Array.from({ length: 18 }, (_, i) => (
              <g key={i} transform={`translate(${60 + i * 64} ${700 + (i % 3) * 22})`}>
                <line x1="0" y1="0" x2="0" y2="18" stroke="#8DB98B" strokeWidth="2" />
                <circle cx="0" cy="0" r="5" fill={["#F4D5DE", "#FFF3D6", "#DCCBF3"][i % 3]} />
              </g>
            ))}
          </svg>
        );
      case "forest":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <rect width="1200" height="800" fill="#EDF2EC" />
            {[0, 1, 2].map((layer) =>
              Array.from({ length: 14 }, (_, i) => {
                const x = i * 95 + layer * 40 - 40;
                const h = 180 + ((i * 37 + layer * 53) % 120) + layer * 60;
                const base = 520 + layer * 110;
                return (
                  <path
                    key={`${layer}-${i}`}
                    d={`M${x} ${base} L${x + 45} ${base - h} L${x + 90} ${base}Z`}
                    fill={["#CFE0CD", "#B6CFB4", "#9CBD9A"][layer]}
                  />
                );
              }),
            )}
            <rect y="700" width="1200" height="100" fill="#8FB28D" />
            <rect width="1200" height="800" fill="#fff" opacity="0.18" />
          </svg>
        );
      case "cozy-room":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <rect width="1200" height="800" fill="#2B2D48" />
            <rect x="0" y="600" width="1200" height="200" fill="#34324F" />
            {/* window */}
            <rect x="380" y="110" width="440" height="360" rx="24" fill="#1D2040" stroke="#4A4770" strokeWidth="14" />
            <clipPath id="win">
              <rect x="387" y="117" width="426" height="346" rx="18" />
            </clipPath>
            <g clipPath="url(#win)">
              <Stars count={45} seed={3} h={470} />
              <circle cx="700" cy="200" r="38" fill="#F6EFD9" />
            </g>
            <line x1="600" y1="117" x2="600" y2="463" stroke="#4A4770" strokeWidth="10" />
            <line x1="387" y1="290" x2="813" y2="290" stroke="#4A4770" strokeWidth="10" />
            {/* warm lamp glow */}
            <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#F8D9A8" stopOpacity="0.55" />
              <stop offset="1" stopColor="#F8D9A8" stopOpacity="0" />
            </radialGradient>
            <circle cx="1000" cy="430" r="260" fill="url(#lamp)" />
            <path d="M960 380 L1040 380 L1020 330 L980 330Z" fill="#F4D6A0" />
            <rect x="996" y="380" width="8" height="160" fill="#5A5478" />
            {/* desk */}
            <rect x="300" y="540" width="620" height="22" rx="8" fill="#5A5478" />
            {/* plant */}
            <rect x="330" y="490" width="50" height="50" rx="10" fill="#C9A98E" />
            <path d="M355 490 C 330 440 340 420 355 400 C 370 420 380 440 355 490Z" fill="#8DB98B" />
            <path d="M355 490 C 310 460 305 440 312 425 C 340 440 350 460 355 490Z" fill="#9CC79A" />
            {/* books */}
            <rect x="760" y="470" width="22" height="70" rx="4" fill="#DCCBF3" />
            <rect x="786" y="480" width="20" height="60" rx="4" fill="#A8C7E8" />
            <rect x="810" y="465" width="24" height="75" rx="4" fill="#F4D5DE" />
          </svg>
        );
      case "rainy-window":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <defs>
              <linearGradient id="rw" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3B4566" />
                <stop offset="1" stopColor="#56607F" />
              </linearGradient>
            </defs>
            <rect width="1200" height="800" fill="url(#rw)" />
            {/* city lights bokeh */}
            {(() => {
              const r = rand(11);
              return Array.from({ length: 40 }, (_, i) => (
                <circle key={i} cx={r() * 1200} cy={420 + r() * 300} r={6 + r() * 26} fill={["#F8D9A8", "#DCCBF3", "#A8C7E8"][i % 3]} opacity={0.12 + r() * 0.2} />
              ));
            })()}
            {/* rain streaks */}
            {(() => {
              const r = rand(29);
              return Array.from({ length: 90 }, (_, i) => {
                const x = r() * 1200;
                const y = r() * 800;
                const l = 20 + r() * 50;
                return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + l} stroke="#DDE6F5" strokeOpacity={0.15 + r() * 0.25} strokeWidth="1.5" strokeLinecap="round" />;
              });
            })()}
            {/* droplets */}
            {(() => {
              const r = rand(41);
              return Array.from({ length: 50 }, (_, i) => (
                <circle key={i} cx={r() * 1200} cy={r() * 800} r={2 + r() * 4} fill="#EEF3FB" opacity={0.25 + r() * 0.3} />
              ));
            })()}
            <rect x="0" y="0" width="1200" height="800" fill="none" stroke="#2E3552" strokeWidth="40" />
          </svg>
        );
      case "desk":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <rect width="1200" height="800" fill="#F7F1E8" />
            <rect x="760" y="80" width="320" height="260" rx="18" fill="#E3EEF8" stroke="#E6DCCB" strokeWidth="12" />
            <circle cx="1000" cy="150" r="30" fill="#FFF3D6" />
            <Cloud x={860} y={240} s={0.5} />
            <rect y="560" width="1200" height="240" fill="#EADFCD" />
            <rect y="550" width="1200" height="18" fill="#DCCDB4" />
            <rect x="160" y="470" width="240" height="90" rx="10" fill="#fff" />
            <rect x="180" y="490" width="140" height="8" rx="4" fill="#E6DCCB" />
            <rect x="180" y="510" width="180" height="8" rx="4" fill="#E6DCCB" />
            <rect x="480" y="460" width="70" height="100" rx="14" fill="#F4D5DE" />
            <path d="M550 485 q 30 0 30 25 q 0 25 -30 25" fill="none" stroke="#F4D5DE" strokeWidth="10" />
            <path d="M505 440 q 10 -15 0 -30 M525 440 q 10 -15 0 -30" stroke="#D6CBB8" strokeWidth="4" fill="none" strokeLinecap="round" />
            <rect x="900" y="480" width="60" height="80" rx="12" fill="#C9A98E" />
            <path d="M930 480 C 900 420 915 395 930 375 C 945 395 960 420 930 480Z" fill="#9CC79A" />
          </svg>
        );
      case "sakura":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <rect width="1200" height="800" fill="#FDF4F4" />
            <path d="M-20 120 C 200 160 300 60 520 110" stroke="#B88E8A" strokeWidth="14" fill="none" strokeLinecap="round" />
            <path d="M300 100 C 360 160 420 170 470 200" stroke="#B88E8A" strokeWidth="8" fill="none" strokeLinecap="round" />
            {(() => {
              const r = rand(5);
              return Array.from({ length: 70 }, (_, i) => {
                const x = i < 30 ? r() * 520 : r() * 1200;
                const y = i < 30 ? 60 + r() * 140 : r() * 800;
                const s = i < 30 ? 9 + r() * 6 : 4 + r() * 5;
                return <ellipse key={i} cx={x} cy={y} rx={s} ry={s * 0.7} transform={`rotate(${r() * 180} ${x} ${y})`} fill={["#F7C9D5", "#F4D5DE", "#FBE1E8"][i % 3]} opacity={0.75} />;
              });
            })()}
            <path d="M0 690 Q 400 640 800 700 T 1200 680 V800 H0Z" fill="#F8E4E8" />
          </svg>
        );
      case "snow":
        return (
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={S}>
            <defs>
              <linearGradient id="sn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#DDE7F2" />
                <stop offset="1" stopColor="#F4F2F8" />
              </linearGradient>
            </defs>
            <rect width="1200" height="800" fill="url(#sn)" />
            <path d="M0 560 Q 300 500 600 560 T 1200 540 V800 H0Z" fill="#FFFFFF" />
            {[200, 330, 900, 1020].map((x, i) => (
              <g key={x} transform={`translate(${x} ${560 - (i % 2) * 20})`}>
                <path d="M0 0 L-40 0 L0 -110 L40 0Z" fill="#B9CCC0" />
                <path d="M-30 -40 L0 -110 L30 -40Z" fill="#fff" opacity="0.7" />
              </g>
            ))}
            {/* cabin */}
            <rect x="540" y="470" width="140" height="90" fill="#C9A98E" />
            <path d="M520 475 L610 410 L700 475Z" fill="#fff" />
            <rect x="590" y="500" width="40" height="40" rx="4" fill="#F8D9A8" />
            {(() => {
              const r = rand(17);
              return Array.from({ length: 80 }, (_, i) => <circle key={i} cx={r() * 1200} cy={r() * 800} r={1.5 + r() * 3} fill="#fff" opacity={0.6 + r() * 0.4} />);
            })()}
          </svg>
        );
      default:
        return null;
    }
  })();
  return <div className={className}>{art}</div>;
}
