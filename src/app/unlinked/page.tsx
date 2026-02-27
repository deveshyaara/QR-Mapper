import Link from "next/link";

export const metadata = {
    title: "Badge Not Linked | QR Mapper",
    description: "This badge has not been linked to a QR ticket yet.",
};

export default function UnlinkedPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-6">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <svg
                        className="w-10 h-10 text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                        />
                    </svg>
                </div>

                {/* Message */}
                <div className="space-y-3">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Badge Not Linked
                    </h1>
                    <p className="text-gray-400 text-base leading-relaxed">
                        This badge hasn&apos;t been linked to a QR ticket yet. Please
                        visit the registration desk and ask a staff member to scan your
                        badge.
                    </p>
                </div>

                {/* Action */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                        />
                    </svg>
                    Back to Home
                </Link>
            </div>
        </main>
    );
}
