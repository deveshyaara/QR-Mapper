import Link from "next/link";
import ParticleNetwork from "./components/ParticleNetwork";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <ParticleNetwork />

      <div className="relative z-10 max-w-lg w-full text-center space-y-10 pt-[55vh]">
        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            QR Mapper
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm mx-auto">
            Link pre-printed badge QR codes to event QR tickets. Fast, simple,
            and reliable.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4">
          <Link
            href="/admin/scan"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-violet-500/30 transition-all duration-300"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
              <svg
                className="w-6 h-6 text-violet-400"
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
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors">
                Staff Scanner
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Link badges to QR tickets
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all"
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
          </Link>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-gray-600 font-mono tracking-wide">
          QR MAPPER • EVENT BADGE LINKER
        </p>
      </div>
    </main >
  );
}
