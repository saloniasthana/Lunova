"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCompanion, type CompanionMood } from "@/stores/companion-store";
import { useData } from "@/stores/data-store";
import { useNow } from "@/hooks/use-now";
import type { CompanionType } from "@/types";
import { cn } from "@/lib/utils";

export const COMPANIONS: {
  id: CompanionType;
  name: string;
  body: string;
  inner: string;
}[] = [
  { id: "cat", name: "Mochi the cat", body: "#F3E6DA", inner: "#F4C9D2" },
  { id: "bunny", name: "Pip the bunny", body: "#FFFFFF", inner: "#F7CAD6" },
  { id: "bear", name: "Bun the bear", body: "#E2C9AE", inner: "#CFAE8C" },
  { id: "panda", name: "Bao the panda", body: "#FFFFFF", inner: "#3A3541" },
  {
    id: "hoodie",
    name: "Momo in a panda hoodie",
    body: "#FFFFFF",
    inner: "#4B2E2B",
  },
  { id: "cloud", name: "Nimbus the cloud", body: "#EEF4FB", inner: "#DCE8F5" },
];

export const ACCESSORIES = [
  { id: "none", name: "None", cost: 0 },
  { id: "bow", name: "Ribbon bow", cost: 0 },
  { id: "scarf", name: "Cozy scarf", cost: 0 },
  { id: "glasses", name: "Study glasses", cost: 0 },
  { id: "flower", name: "Little flower", cost: 0 },
  { id: "beanie", name: "Beanie", cost: 0 },
];

/** Pure illustration — usable anywhere (previews, settings) without the store. */
export function CompanionArt({
  type = "cat",
  mood = "idle",
  accessory = "none",
  size = 120,
  className,
}: {
  type?: CompanionType;
  mood?: CompanionMood;
  accessory?: string;
  size?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const c = COMPANIONS.find((x) => x.id === type) ?? COMPANIONS[0];
  const stroke = "#5B5566";
  const sleeping = mood === "sleep" || mood === "break";
  const happy = mood === "celebrate";
  const panda = type === "panda";
  const eyeInk = panda ? "#FFFFFF" : stroke;
  const hoodie = type === "hoodie";
  const ink = "#4B2E2B";

  const ears = (() => {
    switch (type) {
      case "cat":
        return (
          <>
            <path
              d="M34 46 L40 18 L60 38Z"
              fill={c.body}
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M40 38 L42 26 L52 36Z" fill={c.inner} />
            <path
              d="M106 46 L100 18 L80 38Z"
              fill={c.body}
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M100 38 L98 26 L88 36Z" fill={c.inner} />
          </>
        );
      case "bunny":
        return (
          <>
            <ellipse
              cx="52"
              cy="22"
              rx="10"
              ry="26"
              fill={c.body}
              stroke={stroke}
              strokeWidth="2.5"
              transform="rotate(-10 52 22)"
            />
            <ellipse
              cx="52"
              cy="24"
              rx="4.5"
              ry="17"
              fill={c.inner}
              transform="rotate(-10 52 24)"
            />
            <ellipse
              cx="88"
              cy="22"
              rx="10"
              ry="26"
              fill={c.body}
              stroke={stroke}
              strokeWidth="2.5"
              transform="rotate(10 88 22)"
            />
            <ellipse
              cx="88"
              cy="24"
              rx="4.5"
              ry="17"
              fill={c.inner}
              transform="rotate(10 88 24)"
            />
          </>
        );
      case "bear":
        return (
          <>
            <circle
              cx="40"
              cy="38"
              r="13"
              fill={c.body}
              stroke={stroke}
              strokeWidth="2.5"
            />
            <circle cx="40" cy="38" r="6" fill={c.inner} />
            <circle
              cx="100"
              cy="38"
              r="13"
              fill={c.body}
              stroke={stroke}
              strokeWidth="2.5"
            />
            <circle cx="100" cy="38" r="6" fill={c.inner} />
          </>
        );
      case "panda":
        return (
          <>
            <circle
              cx="40"
              cy="40"
              r="13"
              fill={c.inner}
              stroke={stroke}
              strokeWidth="2.5"
            />
            <circle
              cx="100"
              cy="40"
              r="13"
              fill={c.inner}
              stroke={stroke}
              strokeWidth="2.5"
            />
          </>
        );
      default:
        return null;
    }
  })();

  const head =
    type === "cloud" ? (
      <path
        d="M30 92 C 14 92 12 66 30 64 C 28 44 52 34 64 46 C 72 30 100 32 104 52 C 124 50 130 78 114 88 C 112 96 100 98 96 96 L 40 96 C 36 96 32 95 30 92Z"
        fill={c.body}
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    ) : (
      <ellipse
        cx="70"
        cy="70"
        rx="40"
        ry="34"
        fill={c.body}
        stroke={stroke}
        strokeWidth="2.5"
      />
    );

  const eyes = sleeping ? (
    <g stroke={eyeInk} strokeWidth="2.5" strokeLinecap="round" fill="none">
      <path d="M50 70 q6 5 12 0" />
      <path d="M78 70 q6 5 12 0" />
    </g>
  ) : happy ? (
    <g stroke={eyeInk} strokeWidth="2.5" strokeLinecap="round" fill="none">
      <path d="M50 72 q6 -7 12 0" />
      <path d="M78 72 q6 -7 12 0" />
    </g>
  ) : (
    <g fill={eyeInk}>
      <motion.g
        animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          times: [0, 0.9, 0.93, 0.96, 1],
        }}
        style={{ originY: "68px" }}
      >
        <ellipse cx="56" cy="68" rx="4" ry="5" />
        <ellipse cx="84" cy="68" rx="4" ry="5" />
        {panda ? (
          <>
            <circle cx="56.5" cy="68.5" r="2.4" fill="#2A2630" />
            <circle cx="84.5" cy="68.5" r="2.4" fill="#2A2630" />
          </>
        ) : (
          <>
            <circle cx="57.5" cy="66" r="1.4" fill="#fff" />
            <circle cx="85.5" cy="66" r="1.4" fill="#fff" />
          </>
        )}
      </motion.g>
    </g>
  );

  const mouth = (
    <g stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none">
      {type === "cat" || type === "bunny" ? (
        <path d="M64 80 q3 3 6 0 q3 3 6 0" />
      ) : (
        <path d={happy ? "M63 79 q7 7 14 0" : "M65 80 q5 4 10 0"} />
      )}
    </g>
  );

  const accessoryEl = (() => {
    switch (accessory) {
      case "bow":
        return (
          <g transform="translate(92 40)">
            <path
              d="M0 0 L-12 -8 L-12 8Z M0 0 L12 -8 L12 8Z"
              fill="#F4A9BD"
              stroke={stroke}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle r="3.5" fill="#F7C1CF" stroke={stroke} strokeWidth="1.5" />
          </g>
        );
      case "scarf":
        return (
          <g transform={hoodie ? "translate(0 10)" : undefined}>
            <path
              d="M40 96 Q70 110 100 96 L100 104 Q70 118 40 104Z"
              fill="#A8C7E8"
              stroke={stroke}
              strokeWidth="2"
            />
            <path
              d="M88 104 L92 124 L82 122 L80 106Z"
              fill="#A8C7E8"
              stroke={stroke}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        );
      case "glasses":
        return (
          // Blue frames on the panda so they stand out against its dark eye patches.
          <g
            fill="none"
            stroke={panda ? "#7FA8D6" : hoodie ? ink : stroke}
            strokeWidth={panda ? 2.4 : 2}
            transform={hoodie ? "translate(2 13) scale(0.94)" : undefined}
          >
            <circle cx="56" cy="68" r="10" />
            <circle cx="84" cy="68" r="10" />
            <path d="M66 68 L74 68" />
          </g>
        );
      case "flower":
        return (
          <g transform="translate(46 44)">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx="0"
                cy="-6"
                rx="4"
                ry="6"
                fill="#FFF3D6"
                stroke={stroke}
                strokeWidth="1.2"
                transform={`rotate(${a})`}
              />
            ))}
            <circle r="3.5" fill="#F4D6A0" />
          </g>
        );
      case "beanie":
        return type === "cloud" || hoodie ? null : (
          <g>
            <path
              d="M34 52 Q70 8 106 52Z"
              fill="#DCCBF3"
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <rect
              x="32"
              y="48"
              width="76"
              height="9"
              rx="4.5"
              fill="#C9B3EC"
              stroke={stroke}
              strokeWidth="2"
            />
            <circle
              cx="70"
              cy="18"
              r="6"
              fill="#F4D5DE"
              stroke={stroke}
              strokeWidth="2"
            />
          </g>
        );
      default:
        return null;
    }
  })();

  // "Momo in a panda hoodie" — soft, thick-outlined style with its own face layout.
  const hoodieArt = hoodie ? (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M42 128 C 40 108 48 98 70 98 C 92 98 100 108 98 128 Z"
        fill="#FFFFFF"
        stroke={ink}
        strokeWidth="3"
      />
      <circle cx="34" cy="34" r="13" fill={c.inner} />
      <circle cx="106" cy="34" r="13" fill={c.inner} />
      <ellipse
        cx="70"
        cy="68"
        rx="47"
        ry="43"
        fill="#FFFFFF"
        stroke={ink}
        strokeWidth="3"
      />
      <path
        d="M70 37 c-3 -4.5 -9.5 -1.5 -6.5 3.2 l6.5 5.3 l6.5 -5.3 c3 -4.7 -3.5 -7.7 -6.5 -3.2z"
        fill="#F6C6C0"
        stroke={ink}
        strokeWidth="1.8"
      />
      <ellipse
        cx="70"
        cy="80"
        rx="36"
        ry="29"
        fill="#FFFCF8"
        stroke={ink}
        strokeWidth="3"
      />
      <path
        d="M37.4 67.7 l-4.1 -1.9 M45.9 58.4 l-3.0 -3.3 M58.9 52.4 l-1.4 -4.3 M81.1 52.4 l1.4 -4.3 M94.1 58.4 l3.0 -3.3 M102.6 67.7 l4.1 -1.9"
        fill="none"
        stroke={ink}
        strokeWidth="2.4"
      />
      <circle cx="50" cy="91" r="7.5" fill="#F6C6C0" />
      <circle cx="90" cy="91" r="7.5" fill="#F6C6C0" />
      {sleeping ? (
        <g stroke={ink} strokeWidth="2.8" fill="none">
          <path d="M54 82 q5 4.5 10 0" />
          <path d="M76 82 q5 4.5 10 0" />
        </g>
      ) : happy ? (
        <g stroke={ink} strokeWidth="2.8" fill="none">
          <path d="M54 84 q5 -6.5 10 0" />
          <path d="M76 84 q5 -6.5 10 0" />
        </g>
      ) : (
        <motion.g
          animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            times: [0, 0.9, 0.93, 0.96, 1],
          }}
          style={{ originY: "81px" }}
          fill={ink}
        >
          <circle cx="59" cy="81" r="4.4" />
          <circle cx="81" cy="81" r="4.4" />
          <circle cx="60.4" cy="79.4" r="1.3" fill="#fff" />
          <circle cx="82.4" cy="79.4" r="1.3" fill="#fff" />
        </motion.g>
      )}
      <path
        d="M65.5 90 q2.25 2.6 4.5 0 q2.25 2.6 4.5 0"
        fill="none"
        stroke={ink}
        strokeWidth="2.2"
      />
      {mood !== "focus" && (
        <g>
          <path
            d="M58 103 h24 v12 a8 8 0 0 1 -8 8 h-8 a8 8 0 0 1 -8 -8z"
            fill="#C9E2B8"
            stroke={ink}
            strokeWidth="2.6"
          />
          <path d="M60 108 h20" stroke="#AFCF9B" strokeWidth="2" />
          <ellipse
            cx="56"
            cy="113"
            rx="6"
            ry="5.5"
            fill="#FFFFFF"
            stroke={ink}
            strokeWidth="2.6"
          />
          <ellipse
            cx="84"
            cy="113"
            rx="6"
            ry="5.5"
            fill="#FFFFFF"
            stroke={ink}
            strokeWidth="2.6"
          />
        </g>
      )}
    </g>
  ) : null;

  return (
    <motion.svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={`${c.name}, ${mood === "focus" ? "studying" : sleeping ? "resting" : happy ? "celebrating" : "relaxing"}`}
      animate={
        reduce
          ? undefined
          : happy
            ? { y: [0, -10, 0, -6, 0] }
            : sleeping
              ? { scale: [1, 1.025, 1] }
              : { y: [0, -2, 0] }
      }
      transition={
        happy
          ? { duration: 1.1 }
          : {
              duration: sleeping ? 3.5 : 4,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
    >
      {/* shadow */}
      <ellipse cx="70" cy="128" rx="38" ry="6" fill="#000" opacity="0.06" />
      {hoodieArt}
      {!hoodie && (
        <>
          {/* body */}
          {type !== "cloud" && (
            <ellipse
              cx="70"
              cy="108"
              rx="30"
              ry="20"
              fill={c.body}
              stroke={stroke}
              strokeWidth="2.5"
            />
          )}
          {panda && (
            <g fill={c.inner} stroke={stroke} strokeWidth="2">
              <ellipse cx="53" cy="123" rx="10" ry="6" />
              <ellipse cx="87" cy="123" rx="10" ry="6" />
              <ellipse
                cx="45"
                cy="105"
                rx="8"
                ry="12"
                transform="rotate(28 45 105)"
              />
              <ellipse
                cx="95"
                cy="105"
                rx="8"
                ry="12"
                transform="rotate(-28 95 105)"
              />
            </g>
          )}
          {type === "cat" && (
            <path
              d="M98 112 C 120 110 122 90 112 86"
              fill="none"
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
          {ears}
          {head}
          {/* cheeks */}
          <ellipse
            cx="46"
            cy="80"
            rx="6"
            ry="3.5"
            fill="#F4B9C6"
            opacity="0.7"
          />
          <ellipse
            cx="94"
            cy="80"
            rx="6"
            ry="3.5"
            fill="#F4B9C6"
            opacity="0.7"
          />
          {type === "bear" && (
            <ellipse cx="70" cy="80" rx="11" ry="8" fill="#F1E2D2" />
          )}
          {panda && (
            <g fill={c.inner}>
              <ellipse
                cx="54"
                cy="70"
                rx="9"
                ry="11.5"
                transform="rotate(-28 54 70)"
              />
              <ellipse
                cx="86"
                cy="70"
                rx="9"
                ry="11.5"
                transform="rotate(28 86 70)"
              />
            </g>
          )}
          {eyes}
          <ellipse cx="70" cy="76" rx="3" ry="2.2" fill={stroke} />
          {mouth}
        </>
      )}
      {accessoryEl}
      {/* mood props */}
      {mood === "focus" && (
        <g transform="translate(44 104)">
          <path
            d="M0 0 L26 -4 L26 14 L0 18Z"
            fill="#fff"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M26 -4 L52 0 L52 18 L26 14Z"
            fill="#F8F4FC"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M6 4 L20 2 M6 9 L20 7 M32 2 L46 4 M32 7 L46 9"
            stroke="#C9C3D2"
            strokeWidth="1.5"
          />
        </g>
      )}
      {sleeping && (
        <g fill={stroke} fontFamily="var(--font-nunito)" fontWeight="800">
          <motion.text
            x="108"
            y="40"
            fontSize="14"
            animate={
              reduce ? undefined : { opacity: [0, 1, 0], y: [44, 34, 26] }
            }
            transition={{ duration: 2.6, repeat: Infinity }}
          >
            z
          </motion.text>
          <motion.text
            x="118"
            y="26"
            fontSize="10"
            animate={
              reduce ? undefined : { opacity: [0, 1, 0], y: [30, 20, 12] }
            }
            transition={{ duration: 2.6, repeat: Infinity, delay: 0.9 }}
          >
            z
          </motion.text>
        </g>
      )}
      {happy && (
        <g fill="#F4D6A0">
          {[
            [20, 30],
            [120, 26],
            [14, 80],
            [126, 74],
          ].map(([x, y], i) => (
            <motion.path
              key={i}
              d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2}Z`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 1.4, delay: i * 0.1 }}
              style={{ originX: `${x}px`, originY: `${y}px` }}
            />
          ))}
        </g>
      )}
    </motion.svg>
  );
}

const SIZES = { sm: 72, md: 104, lg: 140 } as const;

/** The live companion — reads mood from the companion store + settings. */
export function Companion({
  className,
  forceSize,
}: {
  className?: string;
  forceSize?: number;
}) {
  const settings = useData((s) => s.settings);
  const base = useCompanion((s) => s.base);
  const reaction = useCompanion((s) => s.reaction);
  const message = useCompanion((s) => s.message);
  const messageUntil = useCompanion((s) => s.messageUntil);
  const now = useNow(500, Boolean(reaction || message));
  const [petted, setPetted] = React.useState(false);

  if (!settings?.companionEnabled) return null;
  const mood = reaction && reaction.until > now ? reaction.mood : base;
  const showMsg = message && messageUntil > now;
  const size = forceSize ?? SIZES[settings.companionSize] ?? SIZES.md;

  const pet = () => {
    const lines = [
      "Purr… thank you!",
      "One small step at a time.",
      "You're doing better than you think.",
      "I'm right here with you.",
    ];
    useCompanion
      .getState()
      .react(
        "celebrate",
        lines[Math.floor(Math.random() * lines.length)],
        1800,
      );
    setPetted(true);
  };

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <AnimatePresence>
        {showMsg && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full z-10 mb-1 w-max max-w-56 rounded-2xl border border-line bg-card px-3 py-2 text-center text-xs font-semibold text-ink shadow-[var(--shadow-lift)]"
            role="status"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={pet}
        className="rounded-full transition-transform hover:scale-[1.03] focus-visible:outline-offset-4"
        aria-label={petted ? "Pet your companion again" : "Pet your companion"}
      >
        <CompanionArt
          type={settings.companionType}
          accessory={settings.companionAccessory}
          mood={mood}
          size={size}
        />
      </button>
    </div>
  );
}
