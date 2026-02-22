import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  opacity: number;
  hue: number;
}

const BokehBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const init = () => {
      resize();
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const count = Math.floor((w * h) / 12000);

      particles = Array.from({ length: Math.min(count, 60) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 40 + 10,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.12 + 0.03,
        hue: Math.random() > 0.5 ? 30 + Math.random() * 20 : 15 + Math.random() * 15,
      }));
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < -p.r) p.x = w + p.r;
        if (p.x > w + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = h + p.r;
        if (p.y > h + p.r) p.y = -p.r;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, `hsla(${p.hue}, 40%, 50%, ${p.opacity})`);
        grad.addColorStop(0.6, `hsla(${p.hue}, 30%, 40%, ${p.opacity * 0.4})`);
        grad.addColorStop(1, `hsla(${p.hue}, 20%, 30%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    init();
    draw();

    window.addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
};

export default BokehBackground;
