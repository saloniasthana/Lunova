import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter, Nunito, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const dmsans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans", display: "swap" });

export const metadata: Metadata = {
  // Absolute base for icon / preview-image URLs. Set AUTH_URL to your real domain when deploying.
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  applicationName: "Lunova",
  title: { default: "Lunova — Your little universe of focus", template: "%s · Lunova" },
  description: "A cozy personal workspace for tasks, focus sessions, habits, and calm sounds.",
  keywords: ["productivity", "pomodoro", "focus timer", "to-do list", "habit tracker", "study with me", "planner"],
  openGraph: {
    type: "website",
    siteName: "Lunova",
    title: "Lunova — Your little universe of focus",
    description: "A cozy personal workspace for tasks, focus sessions, habits, and calm sounds.",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { title: "Lunova", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
};

// Applies the saved theme before first paint to avoid a flash of the default theme.
const themeBoot = `try{var s=JSON.parse(localStorage.getItem('lunova-appearance')||'{}');var d=document.documentElement;if(s.theme)d.dataset.theme=s.theme;if(s.font)d.dataset.font=s.font;if(s.accent)d.style.setProperty('--accent-strong',s.accent);}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="cloud"
      data-font="nunito"
      suppressHydrationWarning
      className={`${nunito.variable} ${inter.variable} ${jakarta.variable} ${dmsans.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="font-sans text-ink antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: "!rounded-2xl !border !border-line !bg-card !text-ink !shadow-[var(--shadow-lift)] !font-sans",
              description: "!text-muted",
            },
          }}
        />
      </body>
    </html>
  );
}
