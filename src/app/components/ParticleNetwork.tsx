"use client";

import { useEffect, useRef, useCallback } from "react";

/* ── Tuning ────────────────────────────────────────────────── */
const SCATTER_RADIUS = 130; // mouse influence zone
const SCATTER_FORCE = 25; // how hard particles flee
const RETURN_SPEED = 0.12; // spring-back speed (0→1)
const FRICTION = 0.82; // velocity damping
const PARTICLE_RADIUS = 2.2;
const TEXT = "SAIT";
const SAMPLE_GAP = 11; // pixel sampling density (lower = more particles)

/* ── Bright color palette ──────────────────────────────────── */
const COLORS = [
    "#00f0ff", // cyan
    "#ff2d95", // hot pink
    "#7b61ff", // electric purple
    "#ffbe0b", // golden yellow
    "#00ff87", // neon green
    "#ff6b35", // tangerine
    "#3a86ff", // vivid blue
    "#f72585", // magenta
];

interface Particle {
    homeX: number;
    homeY: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    radius: number;
}

export default function ParticleNetwork() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const mouse = useRef({ x: -9999, y: -9999, active: false });
    const rafId = useRef(0);
    const initialized = useRef(false);

    /* ── Sample text pixels to generate particle home positions ── */
    const buildParticles = useCallback((W: number, H: number) => {
        const offscreen = document.createElement("canvas");
        offscreen.width = W;
        offscreen.height = H;
        const octx = offscreen.getContext("2d");
        if (!octx) return [];

        // Determine font size: fill ~60% of viewport width
        const fontSize = Math.min(W * 0.42, 500);
        octx.fillStyle = "#fff";
        octx.font = `900 ${fontSize}px "Geist", "Inter", system-ui, sans-serif`;
        octx.textAlign = "center";
        octx.textBaseline = "middle";
        octx.fillText(TEXT, W / 2, H * 0.3);

        const imageData = octx.getImageData(0, 0, W, H).data;
        const pts: Particle[] = [];

        for (let y = 0; y < H; y += SAMPLE_GAP) {
            for (let x = 0; x < W; x += SAMPLE_GAP) {
                const alpha = imageData[(y * W + x) * 4 + 3];
                if (alpha > 128) {
                    pts.push({
                        homeX: x,
                        homeY: y,
                        // start scattered for a nice intro animation
                        x: Math.random() * W,
                        y: Math.random() * H,
                        vx: 0,
                        vy: 0,
                        color: COLORS[Math.floor(Math.random() * COLORS.length)],
                        radius:
                            PARTICLE_RADIUS + (Math.random() - 0.5) * PARTICLE_RADIUS * 0.6,
                    });
                }
            }
        }
        return pts;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

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

            // Rebuild particles on resize so the text stays centered
            particles.current = buildParticles(W, H);
            initialized.current = true;
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

            for (const p of pts) {
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
                    }
                }

                /* ─ spring back to home position ─ */
                p.vx += (p.homeX - p.x) * RETURN_SPEED;
                p.vy += (p.homeY - p.y) * RETURN_SPEED;

                /* ─ friction ─ */
                p.vx *= FRICTION;
                p.vy *= FRICTION;

                /* ─ integrate ─ */
                p.x += p.vx;
                p.y += p.vy;
            }

            /* ── Draw particles ────────────────────────────────────── */
            for (const p of pts) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
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
