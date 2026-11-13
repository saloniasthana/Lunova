import { WallpaperArt } from "@/components/workspace/wallpapers";
import { Logo } from "@/components/layout/logo";
import { AuthIllustration } from "@/components/auth/auth-illustration";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden lg:block" aria-hidden>
        <WallpaperArt id="clouds" className="absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <AuthIllustration />
          <p className="max-w-sm font-display text-2xl font-bold leading-snug text-[#3b4a63]">
            “Your little universe of focus.”
            <span className="mt-2 block text-sm font-semibold text-[#6a7790]">Plan gently. Focus deeply. Rest well.</span>
          </p>
        </div>
      </section>
      <section className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </section>
    </div>
  );
}
