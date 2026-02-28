"use client";

import { useEffect, useRef, useCallback } from "react";

/* ── Tuning ────────────────────────────────────────────────── */
const SCATTER_RADIUS = 140;
const SCATTER_FORCE = 28;
const RETURN_SPEED = 0.1;
const FRICTION = 0.82;
const BASE_RADIUS = 2.8;
const TEXT = "SAIT";
const SAMPLE_GAP = 11;

/* ── Neon LED colors ──────────────────────────────────────── */
const COLORS = [
    { r: 0, g: 240, b: 255 },   // cyan
    { r: 255, g: 45, b: 149 },  // hot pink
    { r: 123, g: 97, b: 255 },  // electric purple
    { r: 59, g: 134, b: 255 },  // vivid blue
    { r: 0, g: 255, b: 135 },   // neon green
    { r: 247, g: 37, b: 133 },  // magenta
    { r: 255, g: 190, b: 11 },  // golden
];

interface Particle3D {
    homeX: number;
    homeY: number;
    x: number;
    y: number;
    z: number;           // depth: -1 (far) to 1 (near)
    vx: number;
    vy: number;
    vz: number;
    color: { r: number; g: number; b: number };
    baseRadius: number;
    phase: number;        // random phase for floating
    floatSpeedX: number;
    floatSpeedY: number;
    floatSpeedZ: number;
    floatAmpX: number;
    floatAmpY: number;
    floatAmpZ: number;
}

export default function ParticleNetwork() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle3D[]>([]);
    const mouse = useRef({ x: -9999, y: -9999, active: false });
    const rafId = useRef(0);
    const startTime = useRef(Date.now());

    /* ── Sample text pixels to generate particle home positions ── */
    const buildParticles = useCallback((W: number, H: number) => {
        const offscreen = document.createElement("canvas");
        offscreen.width = W;
        offscreen.height = H;
        const octx = offscreen.getContext("2d");
        if (!octx) return [];

        const fontSize = Math.min(W * 0.42, 500);
        octx.fillStyle = "#fff";
        octx.font = `900 ${fontSize}px "Geist", "Inter", system-ui, sans-serif`;
        octx.textAlign = "center";
        octx.textBaseline = "middle";
        octx.fillText(TEXT, W / 2, H * 0.3);

        const imageData = octx.getImageData(0, 0, W, H).data;
        const pts: Particle3D[] = [];

        for (let y = 0; y < H; y += SAMPLE_GAP) {
            for (let x = 0; x < W; x += SAMPLE_GAP) {
                const alpha = imageData[(y * W + x) * 4 + 3];
                if (alpha > 128) {
                    const z = (Math.random() - 0.5) * 2; // -1 to 1
                    pts.push({
                        homeX: x,
                        homeY: y,
                        x: Math.random() * W,
                        y: Math.random() * H,
                        z,
                        vx: 0,
                        vy: 0,
                        vz: 0,
                        color: COLORS[Math.floor(Math.random() * COLORS.length)],
                        baseRadius: BASE_RADIUS + (Math.random() - 0.5) * 1.4,
                        phase: Math.random() * Math.PI * 2,
                        floatSpeedX: 0.3 + Math.random() * 0.5,
                        floatSpeedY: 0.4 + Math.random() * 0.6,
                        floatSpeedZ: 0.2 + Math.random() * 0.4,
                        floatAmpX: 1.5 + Math.random() * 2,
                        floatAmpY: 1 + Math.random() * 1.5,
                        floatAmpZ: 0.15 + Math.random() * 0.25,
                    });
                }
            }
        }

        // Sort by z for painter's algorithm (far first)
        pts.sort((a, b) => a.z - b.z);
        return pts;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        startTime.current = Date.now();

        /* ── Sizing ──────────────────────────────────────────────── */
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const W = window.innerWidth;
            const H = window.innerHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width = `${W}px`;
            canvas.style.height = `${H}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            particles.current = buildParticles(W, H);
        };
        resize();

        const ro = new ResizeObserver(resize);
        ro.observe(document.documentElement);

        /* ── Pointer events ──────────────────────────────────────── */
        const setMouse = (x: number, y: number) => {
            mouse.current = { x, y, active: true };
        };
        const onMouseMove = (e: MouseEvent) => setMouse(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => {
            const t = e.touches[0];
            if (t) setMouse(t.clientX, t.clientY);
        };
        const onPointerLeave = () => {
            mouse.current.active = false;
        };

        window.addEventListener("mousemove", onMouseMove, { passive: true });
        window.addEventListener("touchstart", onTouchMove, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        document.addEventListener("mouseleave", onPointerLeave);

        /* ── Render loop ─────────────────────────────────────────── */
        const draw = () => {
            const W = window.innerWidth;
            const H = window.innerHeight;
            ctx.clearRect(0, 0, W, H);

            const pts = particles.current;
            const m = mouse.current;
            const elapsed = (Date.now() - startTime.current) / 1000;

            // Re-sort occasionally for proper depth ordering
            if (Math.floor(elapsed * 2) % 2 === 0) {
                pts.sort((a, b) => a.z - b.z);
            }

            for (const p of pts) {
                /* ─ floating oscillation ─ */
                const floatX = Math.sin(elapsed * p.floatSpeedX + p.phase) * p.floatAmpX;
                const floatY = Math.cos(elapsed * p.floatSpeedY + p.phase * 1.3) * p.floatAmpY;
                const floatZ = Math.sin(elapsed * p.floatSpeedZ + p.phase * 0.7) * p.floatAmpZ;

                /* ─ scatter from mouse ─ */
                if (m.active) {
                    const dx = p.x - m.x;
                    const dy = p.y - m.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < SCATTER_RADIUS && dist > 0) {
                        const force =
                            ((SCATTER_RADIUS - dist) / SCATTER_RADIUS) * SCATTER_FORCE;
                        p.vx += (dx / dist) * force;
                        p.vy += (dy / dist) * force;
                        p.vz += (Math.random() - 0.5) * force * 0.1;
                    }
                }

                /* ─ spring back to home position ─ */
                p.vx += (p.homeX + floatX - p.x) * RETURN_SPEED;
                p.vy += (p.homeY + floatY - p.y) * RETURN_SPEED;
                p.vz += (floatZ - p.vz) * 0.05;

                /* ─ friction ─ */
                p.vx *= FRICTION;
                p.vy *= FRICTION;
                p.vz *= FRICTION;

                /* ─ integrate ─ */
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;
                p.z = Math.max(-1, Math.min(1, p.z)); // clamp
            }

            /* ── Draw particles as 3D LED spheres ────────────────── */
            for (const p of pts) {
                // Depth-based scaling: z=-1 → scale 0.5, z=0 → 1.0, z=1 → 1.5
                const depthScale = 0.7 + (p.z + 1) * 0.4;
                const radius = p.baseRadius * depthScale;

                // Depth-based opacity: far particles dimmer
                const depthOpacity = 0.35 + (p.z + 1) * 0.325; // 0.35 to 1.0

                // Depth-of-field blur simulation: particles far from z=0 get slightly transparent
                const dofFactor = 1 - Math.abs(p.z) * 0.2;
                const finalOpacity = depthOpacity * dofFactor;

                const { r, g, b } = p.color;

                // Outer glow (large, faint)
                const glowRadius = radius * 4;
                const glow = ctx.createRadialGradient(
                    p.x, p.y, 0,
                    p.x, p.y, glowRadius
                );
                glow.addColorStop(0, `rgba(${r},${g},${b},${finalOpacity * 0.35})`);
                glow.addColorStop(0.4, `rgba(${r},${g},${b},${finalOpacity * 0.1})`);
                glow.addColorStop(1, `rgba(${r},${g},${b},0)`);

                ctx.beginPath();
                ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                // Core sphere with highlight
                const sphere = ctx.createRadialGradient(
                    p.x - radius * 0.3, p.y - radius * 0.3, radius * 0.1,
                    p.x, p.y, radius
                );
                sphere.addColorStop(0, `rgba(255,255,255,${finalOpacity * 0.9})`);
                sphere.addColorStop(0.3, `rgba(${r},${g},${b},${finalOpacity * 0.95})`);
                sphere.addColorStop(0.7, `rgba(${r},${g},${b},${finalOpacity * 0.7})`);
                sphere.addColorStop(1, `rgba(${r * 0.3 | 0},${g * 0.3 | 0},${b * 0.3 | 0},${finalOpacity * 0.5})`);

                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = sphere;
                ctx.fill();
            }

            rafId.current = requestAnimationFrame(draw);
        };

        rafId.current = requestAnimationFrame(draw);

        /* ── Cleanup ─────────────────────────────────────────────── */
        return () => {
            cancelAnimationFrame(rafId.current);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("touchstart", onTouchMove);
            window.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("mouseleave", onPointerLeave);
            ro.disconnect();
        };
    }, [buildParticles]);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-0"
            aria-hidden="true"
        />
    );
}
