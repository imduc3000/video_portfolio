import { useEffect, useState } from "react";

/**
 * Premiere-style boot screen with a manual "enter" action.
 */
export default function WelcomeScreen({ onReady }: { onReady: () => void }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p += Math.random() * 14 + 6;
      if (p >= 100) {
        p = 100;
        setProgress(100);
        clearInterval(id);
        setReady(true);
      } else {
        setProgress(p);
      }
    }, 180);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden relative font-mono text-foreground select-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 800px at 20% 10%, oklch(0.35 0.12 280) 0%, transparent 60%)," +
            "radial-gradient(1000px 700px at 90% 90%, oklch(0.35 0.14 200) 0%, transparent 55%)," +
            "linear-gradient(135deg, oklch(0.16 0.02 270) 0%, oklch(0.10 0.01 270) 100%)",
        }}
      />

      <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
        <div
          className="w-[560px] max-w-[92vw] rounded-xl border border-white/10 p-8 text-center"
          style={{
            background: "linear-gradient(135deg, oklch(0.22 0.14 290), oklch(0.12 0.06 290))",
            boxShadow: "0 30px 80px -20px oklch(0.4 0.2 290 / 0.6)",
          }}
        >
          <div
            className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center text-white font-black text-3xl border border-white/20"
            style={{ background: "linear-gradient(135deg, oklch(0.4 0.2 290), oklch(0.25 0.16 290))" }}
          >
            Pr
          </div>
          <div className="mt-5 text-white text-lg font-semibold tracking-wide">
            Adobe Premiere Pro <span className="text-white/50 text-sm font-normal">— NMD Edition</span>
          </div>
          <div className="mt-1 text-white/50 text-[11px]">
            {ready ? "Portfolio_v1.proj loaded." : "Loading Portfolio_v1.proj…"}
          </div>

          <div className="mt-6 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-[width] duration-150" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/40 font-mono">
            <span>{ready ? "Ready to launch." : "Initializing GPU acceleration…"}</span>
            <span>{Math.round(progress)}%</span>
          </div>

          {ready ? (
            <button
              onClick={onReady}
              className="mt-6 px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-[12px] tracking-wide hover:brightness-110"
            >
              Vào Portfolio
            </button>
          ) : (
            <div className="mt-6 text-[10px] text-white/35">Đang khởi động, vui lòng đợi…</div>
          )}

          <div className="mt-5 text-[10px] text-white/30">
            © 2026 NMD.edit — All scenes are rendered in real time.
          </div>
        </div>
      </div>
    </div>
  );
}
