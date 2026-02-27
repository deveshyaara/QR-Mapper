"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { getSupabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step =
    | "scan_badge"       // Step 1: scanning the printed badge
    | "badge_done"       // Acknowledgement: badge scanned, about to scan QR ticket
    | "scan_luma"        // Step 2: scanning the QR ticket
    | "saving"           // Upserting to DB
    | "success"          // Both linked
    | "error";           // Something went wrong

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractBadgeCode(raw: string): string | null {
    // Try full URL first
    try {
        const url = new URL(raw);
        const segments = url.pathname.split("/").filter(Boolean);
        const badgeIdx = segments.indexOf("badge");
        if (badgeIdx !== -1 && segments[badgeIdx + 1]) {
            return segments[badgeIdx + 1];
        }
    } catch {
        // Not a valid URL — try regex fallback
    }
    // Regex fallback for partial paths
    const match = raw.match(/\/badge\/([^/?\s]+)/);
    if (match) return match[1];

    return null;
}

function isLumaUrl(raw: string): boolean {
    return raw.toLowerCase().includes("lu.ma");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StaffScannerPage() {
    const [step, setStep] = useState<Step>("scan_badge");
    const [badgeCode, setBadgeCode] = useState("");
    const [lumaUrl, setLumaUrl] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [scannerKey, setScannerKey] = useState(0);
    const [cameraError, setCameraError] = useState("");

    // Refs to prevent double-scans and leaked timers
    const processingRef = useRef(false);
    const stepRef = useRef<Step>("scan_badge");
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Keep stepRef in sync
    useEffect(() => {
        stepRef.current = step;
    }, [step]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            timersRef.current.forEach(clearTimeout);
        };
    }, []);

    // Helper to schedule a timeout that gets cleaned up on unmount
    const safeTimeout = useCallback((fn: () => void, ms: number) => {
        const id = setTimeout(() => {
            // Remove from tracked timers
            timersRef.current = timersRef.current.filter((t) => t !== id);
            fn();
        }, ms);
        timersRef.current.push(id);
        return id;
    }, []);

    // ── Reset everything for next attendee ──
    const resetState = useCallback(() => {
        // Clear any pending timers
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];

        setStep("scan_badge");
        setBadgeCode("");
        setLumaUrl("");
        setErrorMsg("");
        setCameraError("");
        setScannerKey((k) => k + 1);
        processingRef.current = false;
    }, []);

    // ── Upsert to Supabase ──
    const linkBadge = useCallback(
        async (code: string, url: string) => {
            setStep("saving");

            try {
                const supabase = getSupabase();
                const { error } = await supabase.from("badge_mappings").upsert(
                    { badge_code: code, luma_url: url },
                    { onConflict: "badge_code" }
                );

                if (error) {
                    setStep("error");
                    setErrorMsg(`Database error: ${error.message}`);
                    processingRef.current = false;
                    return;
                }

                setStep("success");
                safeTimeout(resetState, 3000);
            } catch (err) {
                setStep("error");
                setErrorMsg(
                    err instanceof Error ? err.message : "Failed to save. Try again."
                );
                processingRef.current = false;
            }
        },
        [resetState, safeTimeout]
    );

    // ── Trigger upsert when ticket URL is captured ──
    useEffect(() => {
        if (badgeCode && lumaUrl && step === "scan_luma") {
            linkBadge(badgeCode, lumaUrl);
        }
    }, [badgeCode, lumaUrl, step, linkBadge]);

    // ── Badge scan handler ──
    const handleBadgeScan = useCallback(
        (result: { rawValue: string }[]) => {
            // Guard: only process in the correct step, and only once
            if (stepRef.current !== "scan_badge" || processingRef.current) return;
            if (!result?.[0]?.rawValue) return;

            const code = extractBadgeCode(result[0].rawValue);
            if (!code) {
                processingRef.current = true;
                setStep("error");
                setErrorMsg("Could not read badge ID. Make sure you're scanning a valid badge QR code.");
                return;
            }

            processingRef.current = true;
            setBadgeCode(code);
            setStep("badge_done");

            // After 2s acknowledgement, advance to ticket scan
            safeTimeout(() => {
                setStep("scan_luma");
                setScannerKey((k) => k + 1);
                processingRef.current = false;
            }, 2000);
        },
        [safeTimeout]
    );

    // ── QR Ticket scan handler ──
    const handleLumaScan = useCallback(
        (result: { rawValue: string }[]) => {
            // Guard: only process in the correct step, and only once
            if (stepRef.current !== "scan_luma" || processingRef.current) return;
            if (!result?.[0]?.rawValue) return;

            const raw = result[0].rawValue;
            if (!isLumaUrl(raw)) {
                processingRef.current = true;
                setStep("error");
                setErrorMsg("That doesn't look like a valid QR ticket. Please scan the attendee's ticket QR code.");
                return;
            }

            processingRef.current = true;
            setLumaUrl(raw);
        },
        []
    );

    // ── Camera error handler ──
    const handleCameraError = useCallback((error: unknown) => {
        setCameraError(
            error instanceof Error ? error.message : "Camera access denied."
        );
    }, []);

    // ── Which scan step are we on? ──
    const scanStepNum =
        step === "scan_badge" || step === "badge_done" ? 1 : 2;
    const progressWidth =
        step === "scan_badge"
            ? "25%"
            : step === "badge_done"
                ? "50%"
                : step === "scan_luma"
                    ? "75%"
                    : "100%";

    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
            {/* ── Header ── */}
            <header className="border-b border-white/5 px-5 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">QR Mapper</h1>
                    <p className="text-xs text-gray-500">Staff Scanner</p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live
                </span>
            </header>

            {/* ── Progress bar ── */}
            <div className="w-full h-1 bg-white/5">
                <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
                    style={{ width: progressWidth }}
                />
            </div>

            {/* ── Step pills ── */}
            <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all duration-300 ${step === "badge_done" || scanStepNum === 2
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                        }`}
                >
                    {(scanStepNum > 1 || step === "badge_done") && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    )}
                    1 · Badge
                </div>
                <div className="w-4 h-px bg-white/10" />
                <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all duration-300 ${scanStepNum === 2
                        ? step === "success" || step === "saving"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                        : "bg-white/5 text-gray-600 border border-white/5"
                        }`}
                >
                    {step === "success" && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    )}
                    2 · Ticket
                </div>
            </div>

            {/* ── Main content area ── */}
            <div className="flex-1 px-5 pb-5 flex flex-col gap-4">

                {/* ═══════ SCAN BADGE ═══════ */}
                {step === "scan_badge" && (
                    <>
                        <div className="space-y-1 py-2">
                            <h2 className="text-xl font-bold tracking-tight">
                                Scan Badge QR
                            </h2>
                            <p className="text-sm text-gray-400">
                                Point the camera at the attendee&apos;s <strong className="text-gray-300">printed badge</strong>.
                            </p>
                        </div>
                        <div className="relative w-full aspect-square max-h-[55vh] rounded-2xl overflow-hidden border border-white/10 bg-black">
                            {cameraError ? (
                                <CameraErrorView error={cameraError} onRetry={() => { setCameraError(""); setScannerKey((k) => k + 1); }} />
                            ) : (
                                <>
                                    <Scanner
                                        key={scannerKey}
                                        onScan={handleBadgeScan}
                                        onError={handleCameraError}
                                        formats={["qr_code"]}
                                        sound={false}
                                        styles={{ container: { width: "100%", height: "100%" }, video: { objectFit: "cover", width: "100%", height: "100%" } }}
                                    />
                                    <ScanOverlay color="violet" />
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* ═══════ BADGE DONE ACKNOWLEDGEMENT ═══════ */}
                {step === "badge_done" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-10 qr-fade-in">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center qr-scale-in">
                            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-emerald-400">Badge Scanned!</h2>
                            <p className="text-gray-400">
                                Badge ID: <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded-md">{badgeCode}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                            Next: Scan QR Ticket…
                        </div>
                    </div>
                )}

                {/* ═══════ SCAN LUMA ═══════ */}
                {step === "scan_luma" && (
                    <>
                        <div className="space-y-1 py-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    ✓ Badge: {badgeCode}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">
                                Now Scan QR Ticket
                            </h2>
                            <p className="text-sm text-gray-400">
                                Scan the attendee&apos;s <strong className="text-gray-300">QR ticket</strong> on their phone.
                            </p>
                        </div>
                        <div className="relative w-full aspect-square max-h-[55vh] rounded-2xl overflow-hidden border border-white/10 bg-black">
                            {cameraError ? (
                                <CameraErrorView error={cameraError} onRetry={() => { setCameraError(""); setScannerKey((k) => k + 1); }} />
                            ) : (
                                <>
                                    <Scanner
                                        key={scannerKey}
                                        onScan={handleLumaScan}
                                        onError={handleCameraError}
                                        formats={["qr_code"]}
                                        sound={false}
                                        styles={{ container: { width: "100%", height: "100%" }, video: { objectFit: "cover", width: "100%", height: "100%" } }}
                                    />
                                    <ScanOverlay color="fuchsia" />
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* ═══════ SAVING ═══════ */}
                {step === "saving" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-10">
                        <div className="w-16 h-16 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                        <p className="text-gray-400 text-sm font-medium">Linking badge to ticket…</p>
                    </div>
                )}

                {/* ═══════ SUCCESS ═══════ */}
                {step === "success" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-10 qr-fade-in">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center qr-scale-in">
                            <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-emerald-400">Linked Successfully!</h2>
                            <p className="text-gray-400 text-sm">
                                Badge <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded-md">{badgeCode}</span> is now connected.
                            </p>
                        </div>
                        <p className="text-xs text-gray-600 animate-pulse">
                            Resetting for next attendee…
                        </p>
                    </div>
                )}

                {/* ═══════ ERROR ═══════ */}
                {step === "error" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-10 qr-fade-in">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold text-red-400">Something Went Wrong</h2>
                            <p className="text-gray-400 text-sm max-w-xs">{errorMsg}</p>
                        </div>
                        <button
                            onClick={resetState}
                            className="px-6 py-3 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all duration-150"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* ── Manual reset (visible during scanning steps) ── */}
                {(step === "scan_badge" || step === "scan_luma") && (
                    <button
                        onClick={resetState}
                        className="w-full py-3.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all duration-150"
                    >
                        Reset &amp; Start Over
                    </button>
                )}
            </div>
        </main>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScanOverlay({ color }: { color: "violet" | "fuchsia" }) {
    const c = color === "violet" ? "border-violet-400" : "border-fuchsia-400";
    return (
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-[15%] border-2 border-white/20 rounded-2xl" />
            <div className={`absolute top-[15%] left-[15%] w-8 h-8 border-t-2 border-l-2 ${c} rounded-tl-2xl`} />
            <div className={`absolute top-[15%] right-[15%] w-8 h-8 border-t-2 border-r-2 ${c} rounded-tr-2xl`} />
            <div className={`absolute bottom-[15%] left-[15%] w-8 h-8 border-b-2 border-l-2 ${c} rounded-bl-2xl`} />
            <div className={`absolute bottom-[15%] right-[15%] w-8 h-8 border-b-2 border-r-2 ${c} rounded-br-2xl`} />
            <div className="absolute inset-[15%] flex items-end justify-center pb-4">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur text-[11px] text-white/70 font-mono">
                    Align QR in frame
                </span>
            </div>
        </div>
    );
}

function CameraErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
            </div>
            <div>
                <p className="font-semibold text-white text-sm">Camera Not Available</p>
                <p className="text-xs text-gray-400 mt-1">{error}</p>
            </div>
            <button
                onClick={onRetry}
                className="mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
                Retry Camera
            </button>
        </div>
    );
}
