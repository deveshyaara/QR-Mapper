"use client";

import { useEffect, useRef } from "react";

export default function FuturisticBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafId = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        // Pre-create grain texture canvas
        const grainCanvas = document.createElement("canvas");
        const grainSize = 128;
        grainCanvas.width = grainSize;
        grainCanvas.height = grainSize;
        const gctx = grainCanvas.getContext("2d")!;
        const grainData = gctx.createImageData(grainSize, grainSize);
        for (let i = 0; i < grainData.data.length; i += 4) {
            const v = Math.random() * 255;
            grainData.data[i] = v;
            grainData.data[i + 1] = v;
            grainData.data[i + 2] = v;
            grainData.data[i + 3] = 12; // very subtle
        }
        gctx.putImageData(grainData, 0, 0);

        const startTime = Date.now();

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const W = window.innerWidth;
            const H = window.innerHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width = `${W}px`;
            canvas.style.height = `${H}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();

        const ro = new ResizeObserver(resize);
        ro.observe(document.documentElement);

        // Dust motes
        const dustCount = 60;
        const dust = Array.from({ length: dustCount }, () => ({
            x: Math.random(),
            y: Math.random(),
            speed: 0.0002 + Math.random() * 0.0004,
            size: 0.5 + Math.random() * 1.2,
            opacity: 0.08 + Math.random() * 0.15,
            phase: Math.random() * Math.PI * 2,
        }));

        const draw = () => {
            const W = window.innerWidth;
            const H = window.innerHeight;
            const t = (Date.now() - startTime) / 1000;

            // ── Matte dark background (flat, uniform) ──
            const bgGrad = ctx.createRadialGradient(
                W * 0.5, H * 0.4, 0,
                W * 0.5, H * 0.4, Math.max(W, H) * 1.1
            );
            bgGrad.addColorStop(0, "#08081a");
            bgGrad.addColorStop(0.3, "#070716");
            bgGrad.addColorStop(0.7, "#060614");
            bgGrad.addColorStop(1, "#050510");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // ── Perspective grid ──
            ctx.save();
            const gridSpacing = 50;
            const horizonY = H * 0.55;
            const vanishX = W * 0.5;

            // Horizontal lines with perspective
            ctx.strokeStyle = "rgba(60, 80, 160, 0.06)";
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 30; i++) {
                const yFrac = i / 30;
                const y = horizonY + yFrac * yFrac * (H - horizonY) * 1.3;
                const spread = 0.3 + yFrac * 0.7;
                const alpha = 0.03 + yFrac * 0.05;
                ctx.strokeStyle = `rgba(60, 80, 160, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(vanishX - W * spread, y);
                ctx.lineTo(vanishX + W * spread, y);
                ctx.stroke();
            }

            // Vertical lines converging to vanishing point
            const verticalLines = 20;
            for (let i = -verticalLines; i <= verticalLines; i++) {
                const xBottom = vanishX + i * gridSpacing * 3;
                const alpha = 0.02 + (1 - Math.abs(i) / verticalLines) * 0.04;
                ctx.strokeStyle = `rgba(60, 80, 160, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(vanishX, horizonY);
                ctx.lineTo(xBottom, H + 50);
                ctx.stroke();
            }
            ctx.restore();

            // ── Topographical contour rings ──
            ctx.save();
            const cx = W * 0.5;
            const cy = H * 0.32;
            for (let ring = 0; ring < 8; ring++) {
                const baseR = 80 + ring * 55;
                const wobble = Math.sin(t * 0.3 + ring * 0.8) * 10;
                const r = baseR + wobble;
                const alpha = 0.025 - ring * 0.002;
                if (alpha <= 0) continue;

                ctx.strokeStyle = `rgba(100, 130, 255, ${Math.max(alpha, 0.005)})`;
                ctx.lineWidth = 0.6;
                ctx.beginPath();

                // Slightly irregular ellipses
                for (let a = 0; a <= Math.PI * 2; a += 0.05) {
                    const noiseR = r + Math.sin(a * 3 + t * 0.5 + ring) * 8 +
                        Math.cos(a * 5 - t * 0.3) * 4;
                    const px = cx + Math.cos(a) * noiseR * 1.4;
                    const py = cy + Math.sin(a) * noiseR * 0.6;
                    if (a === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            }
            ctx.restore();

            // ── Ambient dust motes ──
            for (const d of dust) {
                d.y -= d.speed;
                d.x += Math.sin(t * 0.5 + d.phase) * 0.0002;
                if (d.y < -0.05) {
                    d.y = 1.05;
                    d.x = Math.random();
                }

                const dx = d.x * W;
                const dy = d.y * H;
                const pulse = 0.7 + Math.sin(t * 1.5 + d.phase) * 0.3;

                ctx.beginPath();
                ctx.arc(dx, dy, d.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(140, 160, 255, ${d.opacity * pulse})`;
                ctx.fill();
            }

            // ── Soft vignette ──
            const vignette = ctx.createRadialGradient(
                W * 0.5, H * 0.4, W * 0.3,
                W * 0.5, H * 0.5, Math.max(W, H) * 0.85
            );
            vignette.addColorStop(0, "rgba(0,0,0,0)");
            vignette.addColorStop(1, "rgba(0,0,0,0.25)");
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, W, H);

            // ── Film grain for matte texture ──
            ctx.globalAlpha = 0.035;
            const pattern = ctx.createPattern(grainCanvas, "repeat");
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, W, H);
            }
            ctx.globalAlpha = 1;

            rafId.current = requestAnimationFrame(draw);
        };

        rafId.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafId.current);
            ro.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0"
            aria-hidden="true"
        />
    );
}
