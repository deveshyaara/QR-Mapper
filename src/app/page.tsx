import Link from "next/link";
import ParticleNetwork from "./components/ParticleNetwork";
import FuturisticBackground from "./components/FuturisticBackground";

export default function HomePage() {
  return (
    <main className="min-h-screen text-white flex items-center justify-center px-6 overflow-hidden">
      <FuturisticBackground />
      <ParticleNetwork />

      <div className="relative z-10 max-w-lg w-full text-center space-y-12 pt-[22vh]">
        {/* Subtitle under SAIT particle text */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-mono tracking-[0.35em] text-cyan-300/60 uppercase">
            Event Management System
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-violet-500/40" />
            <span className="text-[10px] text-violet-400/50 tracking-widest font-mono">
              ✦
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-violet-500/40" />
          </div>
        </div>

        {/* Staff Scanner — Glassmorphic 3D Button */}
        <div className="flex justify-center">
          <Link
            href="/admin/scan"
            className="group relative glass-button"
          >
            {/* Glow border effect */}
            <span className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-400/20 via-violet-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

            {/* Glass card */}
            <span className="relative flex items-center gap-4 px-7 py-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.05)_inset] group-hover:bg-white/[0.07] group-hover:border-violet-400/25 group-hover:shadow-[0_12px_40px_rgba(123,97,255,0.15),0_1px_0_rgba(255,255,255,0.08)_inset] transition-all duration-500">
              {/* Scanner icon */}
              <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border border-violet-400/15 flex items-center justify-center group-hover:from-violet-500/25 group-hover:to-cyan-500/20 group-hover:border-violet-400/30 transition-all duration-500 shadow-[0_0_15px_rgba(123,97,255,0.08)]">
                <svg
                  className="w-6 h-6 text-violet-300 group-hover:text-cyan-300 transition-colors duration-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                  />
                </svg>
              </span>

              {/* Label */}
              <span className="text-left flex-1">
                <span className="block font-semibold text-[15px] text-white group-hover:text-violet-200 transition-colors duration-300">
                  Staff Scanner
                </span>
                <span className="block text-xs text-gray-400/80 mt-0.5 group-hover:text-gray-300/80 transition-colors">
                  Link badges to QR tickets
                </span>
              </span>

              {/* Arrow */}
              <svg
                className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </span>
          </Link>
        </div>

        {/* Footer */}
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500/60 font-mono tracking-[0.25em] uppercase">
            QR Mapper • Event Badge Linker
          </p>
          <div className="flex justify-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400/30" />
            <span className="w-1 h-1 rounded-full bg-violet-400/30" />
            <span className="w-1 h-1 rounded-full bg-pink-400/30" />
          </div>
        </div>
      </div>
    </main>
  );
}
