"use client";

import { useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ParticleCanvasProps {
  activeCount: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
}

export function ParticleCanvas({ activeCount }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const activeCountRef = useRef(activeCount);
  activeCountRef.current = activeCount;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = isMobile ? 0.33 : 0.5;
    const maxParticles = isMobile ? 80 : 150;
    const minParticles = isMobile ? 30 : 60;

    const resize = () => {
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
    };
    resize();
    window.addEventListener("resize", resize);

    const createParticle = (): Particle => {
      const baseAlpha = 0.15 + Math.random() * 0.25;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.1,
        size: 1 + Math.random() * 1.5,
        alpha: baseAlpha,
        baseAlpha,
      };
    };

    particlesRef.current = [];

    const stageEl = canvas.closest("main");
    let running = false;

    const tick = () => {
      const count = activeCountRef.current;
      const targetCount =
        count >= 5
          ? Math.round(minParticles + ((count - 4) / 2) * (maxParticles - minParticles))
          : 0;

      // Stop loop when no particles to draw
      if (targetCount === 0 && particlesRef.current.length === 0) {
        running = false;
        return;
      }

      const speed = 0.3 + (count / 6) * 1.2;
      const audioLevel = parseFloat(
        stageEl?.style.getPropertyValue("--audio-level") || "0",
      );

      while (particlesRef.current.length < targetCount) {
        particlesRef.current.push(createParticle());
      }
      if (particlesRef.current.length > targetCount) {
        particlesRef.current.length = targetCount;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        const audioPush = audioLevel * 0.5;
        p.x += (Math.random() - 0.5) * audioPush;
        p.y += (Math.random() - 0.5) * audioPush;
        p.alpha = p.baseAlpha + audioLevel * 0.15;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(228, 49, 34, ${p.alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // Start/restart loop when activeCount changes
    const startLoop = () => {
      if (!running) {
        running = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    // Check periodically if we should start (activeCount changed)
    const checkInterval = setInterval(() => {
      if (activeCountRef.current >= 5 && !running) startLoop();
    }, 200);
    startLoop();

    return () => {
      running = false;
      clearInterval(checkInterval);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      particlesRef.current = [];
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: "100%", height: "100%", opacity: 0.8 }}
      aria-hidden="true"
    />
  );
}
