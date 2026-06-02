import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Scissors,
  MousePointer2,
  Volume2,
  Maximize2,
  Film,
  Music2,
  Type,
  Sparkles,
  Folder,
  Mail,
  Phone,
  GraduationCap,
  Trophy,
  Dumbbell,
  Languages,
  Wrench,
  Clapperboard,
  Circle,
  Square as SquareIcon,
  X,
  Lock,
} from "lucide-react";

/* ---------- Demo reel data ---------- */
type ReelItem = {
  id: string;
  title: string;
  category: string;
  youtubeId: string;
  isShort?: boolean;
  duration: string;
};
const reelItems: ReelItem[] = [
  { id: "r1", title: "Project · Long Form",  category: "YouTube · Long",   youtubeId: "MiPI3LULQTo", duration: "Long" },
  { id: "r2", title: "Vertical Short",       category: "YouTube · Shorts", youtubeId: "ORaPIeSzFkk", isShort: true, duration: "9:16" },
  { id: "r3", title: "Featured Edit",        category: "YouTube · Long",   youtubeId: "bILOg-jIs-M", duration: "Long" },
  { id: "r4", title: "Highlight Cut",        category: "YouTube · Long",   youtubeId: "1NmVhyJKzpw", duration: "Long" },
];

/* ---------- Data: timeline clips ---------- */

type ClipKind = "video" | "audio" | "text" | "fx";
type Clip = {
  id: string;
  track: ClipKind;
  start: number; // seconds
  duration: number;
  label: string;
  sectionId?: SectionId;
  color?: string;
};

type SectionId =
  | "intro"
  | "about"
  | "education"
  | "skills"
  | "experience"
  | "achievements"
  | "reel"
  | "interests"
  | "contact";

const TOTAL = 60; // total timeline seconds
const CONTACT_START = 55;
const CONTACT_RENDER_DURATION = 4;
const CONTACT_RENDER_END = CONTACT_START + CONTACT_RENDER_DURATION;

const initialClips: Clip[] = [
  { id: "v-intro", track: "video", start: 0, duration: 6, label: "01_Intro.mp4", sectionId: "intro" },
  { id: "v-about", track: "video", start: 6, duration: 8, label: "02_About.mp4", sectionId: "about" },
  { id: "v-edu", track: "video", start: 14, duration: 6, label: "03_Education.mp4", sectionId: "education" },
  { id: "v-skills", track: "video", start: 20, duration: 9, label: "04_Skills.mp4", sectionId: "skills" },
  { id: "v-exp", track: "video", start: 29, duration: 9, label: "05_Experience.mp4", sectionId: "experience" },
  { id: "v-ach", track: "video", start: 38, duration: 6, label: "06_Achievements.mp4", sectionId: "achievements" },
  { id: "v-reel", track: "video", start: 44, duration: 7, label: "07_Reel.mov", sectionId: "reel" },
  { id: "v-int", track: "video", start: 51, duration: 4, label: "08_Interests.mp4", sectionId: "interests" },
  { id: "v-ct", track: "video", start: 55, duration: 5, label: "09_Contact.mp4", sectionId: "contact" },

  { id: "a-bgm", track: "audio", start: 0, duration: 55, label: "BGM_lofi_loop.wav" },
  { id: "a-vo", track: "audio", start: 6, duration: 32, label: "Voiceover_takes.wav" },

  { id: "t-name", track: "text", start: 1, duration: 5, label: "Title — Name" },
  { id: "t-hl", track: "text", start: 20, duration: 9, label: "Lower thirds — Skills" },
  { id: "t-end", track: "text", start: 55, duration: 5, label: "Contact card" },

  { id: "fx-in", track: "fx", start: 0, duration: 1.2, label: "Fade In" },
  { id: "fx-tr1", track: "fx", start: 13.5, duration: 1, label: "Zoom Cut" },
  { id: "fx-tr2", track: "fx", start: 43.5, duration: 1, label: "Glitch" },
  { id: "fx-out", track: "fx", start: 58.8, duration: 1.2, label: "Render Out" },
];

const trackMeta: Record<ClipKind, { label: string; icon: typeof Film; varName: string }> = {
  video: { label: "V1", icon: Film, varName: "--color-track-video" },
  text: { label: "T1", icon: Type, varName: "--color-track-text" },
  fx: { label: "FX", icon: Sparkles, varName: "--color-track-fx" },
  audio: { label: "A1", icon: Music2, varName: "--color-track-audio" },
};

const trackOrder: ClipKind[] = ["video", "text", "fx", "audio"];

/* ---------- Helpers ---------- */
const pad = (n: number) => n.toString().padStart(2, "0");
const fmtTime = (t: number) => {
  const s = Math.max(0, Math.min(TOTAL, t));
  const mm = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  const ff = Math.floor((s % 1) * 30);
  return `${pad(mm)}:${pad(ss)}:${pad(ff)}`;
};

/* ---------- Main Component ---------- */

export default function EditorPortfolio() {
  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tool, setTool] = useState<"select" | "razor">("select");
  const [selectedClip, setSelectedClip] = useState<string | null>("v-intro");
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [reelOpen, setReelOpen] = useState<ReelItem | null>(null);
  const [hasCut, setHasCut] = useState(false);
  const [hasSpeedUp, setHasSpeedUp] = useState(false);
  const [hasZoomed, setHasZoomed] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (zoom > 1) setHasZoomed(true);
  }, [zoom]);


  /* playback loop */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setTime((t) => {
        const next = t + dt * speed;
        const stopAt = Math.min(CONTACT_RENDER_END, TOTAL);
        if (next >= stopAt) {
          setPlaying(false);
          return stopAt;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key === "v" || e.key === "V") setTool("select");
      if (e.key === "c" || e.key === "C") setTool("razor");
      if (e.key === "ArrowRight") setTime((t) => Math.min(TOTAL, t + 1));
      if (e.key === "ArrowLeft") setTime((t) => Math.max(0, t - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pxPerSec = 18 * zoom;
  const timelineWidth = TOTAL * pxPerSec;
  const skillsUnlocked = hasSpeedUp || hasZoomed;
  const reelUnlocked = hasCut;

  const handleSpeedChange = (n: number) => {
    setSpeed(n);
    if (n > 1) setHasSpeedUp(true);
  };

  const seekFromEvent = useCallback(
    (e: { clientX: number }) => {
      const el = timelineRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left + el.scrollLeft;
      const t = Math.max(0, Math.min(TOTAL, x / pxPerSec));
      setTime(t);
    },
    [pxPerSec],
  );

  const onTimelineMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    seekFromEvent(e);
  };
  useEffect(() => {
    const move = (e: MouseEvent) => { if (draggingRef.current) seekFromEvent(e); };
    const up = () => { draggingRef.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [seekFromEvent]);

  const handleClipClick = (clip: Clip, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === "razor") {
      // Cut clip at playhead if playhead is inside it
      if (time > clip.start + 0.2 && time < clip.start + clip.duration - 0.2) {
        const splitAt = time;
        setClips((prev) => {
          const idx = prev.findIndex((c) => c.id === clip.id);
          if (idx === -1) return prev;
          const a: Clip = { ...clip, duration: splitAt - clip.start };
          const b: Clip = {
            ...clip,
            id: `${clip.id}-b-${Math.random().toString(36).slice(2, 6)}`,
            start: splitAt,
            duration: clip.start + clip.duration - splitAt,
            label: clip.label.replace(/\.(\w+)$/, "_cut.$1"),
          };
          const next = [...prev];
          next.splice(idx, 1, a, b);
          return next;
        });
        setHasCut(true);
        return;
      }
    }
    setSelectedClip(clip.id);
    setTime(clip.start + 0.05);
  };

  /* current active section based on playhead */
  const activeClip = useMemo(() => {
    return [...clips]
      .filter((c) => c.track === "video")
      .sort((a, b) => a.start - b.start)
      .find((c) => time >= c.start && time < c.start + c.duration);
  }, [clips, time]);

  const activeSection: SectionId = activeClip?.sectionId ?? "intro";

  const selected = clips.find((c) => c.id === selectedClip) ?? activeClip ?? clips[0];
  const locks = { skills: !skillsUnlocked, reel: !reelUnlocked };

  return (
    <>
    <div className="h-screen w-screen flex flex-col bg-background text-foreground select-none font-mono text-[12px]">
      <MenuBar />
      <div className="flex-1 grid grid-cols-[260px_1fr_280px] gap-px bg-border min-h-0">
        <ProjectBin
          clips={clips}
          selected={selected?.id ?? null}
          onSelect={(c) => { setSelectedClip(c.id); setTime(c.start + 0.05); }}
        />
        <PreviewMonitor
          section={activeSection}
          time={time}
          playing={playing}
          onOpenReel={setReelOpen}
          locks={locks}
        />
        <Inspector clip={selected} time={time} />
      </div>

      <Transport
        time={time}
        playing={playing}
        onPlayPause={() => setPlaying((p) => !p)}
        onPrev={() => {
          const prev = [...clips]
            .filter((c) => c.track === "video")
            .sort((a, b) => a.start - b.start)
            .reverse()
            .find((c) => c.start < time - 0.1);
          setTime(prev ? prev.start + 0.02 : 0);
        }}
        onNext={() => {
          const next = [...clips]
            .filter((c) => c.track === "video")
            .sort((a, b) => a.start - b.start)
            .find((c) => c.start > time + 0.05);
          setTime(next ? next.start + 0.02 : TOTAL);
        }}
        tool={tool}
        setTool={setTool}
        speed={speed}
        setSpeed={handleSpeedChange}
        zoom={zoom}
        setZoom={setZoom}
      />

      <Timeline
        clips={clips}
        time={time}
        pxPerSec={pxPerSec}
        timelineWidth={timelineWidth}
        timelineRef={timelineRef}
        onMouseDown={onTimelineMouseDown}
        onClipClick={handleClipClick}
        tool={tool}
        selectedClip={selectedClip}
      />
    </div>

      {reelOpen && (
        <ReelModal item={reelOpen} onClose={() => setReelOpen(null)} />
      )}
    </>
  );
}

/* ---------- Menu Bar ---------- */
function MenuBar() {
  const items = ["File", "Edit", "Clip", "Sequence", "Marker", "Window", "Help"];
  return (
    <div className="flex items-center justify-between h-9 px-3 bg-panel border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
          <Clapperboard className="w-3 h-3 text-primary-foreground" />
        </div>
        <span className="text-foreground font-semibold tracking-wide">NMD.edit</span>
        <span className="text-muted-foreground ml-3">Portfolio_v1.proj</span>
      </div>
      <div className="flex items-center gap-4 text-muted-foreground">
        {items.map((i) => (
          <span key={i} className="hover:text-foreground cursor-default">{i}</span>
        ))}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Circle className="w-2 h-2 fill-track-audio text-track-audio" />
        <span>autosaved</span>
      </div>
    </div>
  );
}

/* ---------- Project Bin (left) ---------- */
function ProjectBin({
  clips, selected, onSelect,
}: { clips: Clip[]; selected: string | null; onSelect: (c: Clip) => void }) {
  const grouped: Record<ClipKind, Clip[]> = { video: [], audio: [], text: [], fx: [] };
  for (const c of clips) grouped[c.track].push(c);
  return (
    <aside className="bg-panel flex flex-col min-h-0">
      <PanelHeader title="Project" sub="bin" />
      <div className="px-3 py-2 text-muted-foreground flex items-center gap-2 border-b border-border">
        <Folder className="w-3.5 h-3.5" />
        <span>NguyenMinhDuc / portfolio</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {trackOrder.map((kind) => {
          const Icon = trackMeta[kind].icon;
          return (
            <div key={kind} className="border-b border-border/60">
              <div className="px-3 py-1.5 flex items-center gap-2 text-muted-foreground bg-surface">
                <Icon className="w-3 h-3" />
                <span className="uppercase tracking-wider">{kind}</span>
                <span className="ml-auto">{grouped[kind].length}</span>
              </div>
              {grouped[kind].map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-surface transition-colors ${
                    selected === c.id ? "bg-surface-elevated text-primary" : "text-foreground/80"
                  }`}
                >
                  <span
                    className="w-1.5 h-4 rounded-sm shrink-0"
                    style={{ background: `var(${trackMeta[kind].varName})` }}
                  />
                  <span className="truncate">{c.label}</span>
                  <span className="ml-auto text-muted-foreground">{c.duration.toFixed(1)}s</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function PanelHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="h-8 px-3 flex items-center gap-2 bg-surface border-b border-border">
      <span className="text-foreground font-semibold">{title}</span>
      {sub && <span className="text-muted-foreground">· {sub}</span>}
    </div>
  );
}

/* ---------- Preview Monitor (center) ---------- */
function PreviewMonitor({
  section, time, playing, onOpenReel, locks,
}: {
  section: SectionId;
  time: number;
  playing: boolean;
  onOpenReel: (r: ReelItem) => void;
  locks: { skills: boolean; reel: boolean };
}) {
  return (
    <section className="bg-panel flex flex-col min-h-0">
      <PanelHeader title="Program" sub="1920 × 1080 · 30fps" />
      <div className="flex-1 flex items-center justify-center p-6 bg-[oklch(0.12_0.005_270)] min-h-0">
        <div className="relative w-full max-w-[820px] aspect-video bg-black rounded-md overflow-hidden border border-border shadow-[0_0_60px_-20px_oklch(0.78_0.18_195_/_0.4)]">
          {/* safe area guides */}
          <div className="absolute inset-4 border border-white/5 rounded-sm pointer-events-none" />
          <div className="absolute inset-12 border border-white/5 rounded-sm pointer-events-none" />

          <div className="absolute inset-0 flex items-center justify-center p-8">
            <SectionContent section={section} time={time} onOpenReel={onOpenReel} locks={locks} playing={playing} />
          </div>

          {/* overlay HUD */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] text-white/60 font-mono">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${playing ? "bg-destructive animate-pulse" : "bg-white/40"}`} />
              <span>{playing ? "● REC PREVIEW" : "PAUSED"}</span>
            </div>
            <span>{fmtTime(time)} / {fmtTime(TOTAL)}</span>
          </div>
          <div className="absolute bottom-3 left-3 text-[10px] text-white/40 font-mono">
            CAM_A · ISO 400 · 24mm · f/2.8
          </div>
          <div className="absolute bottom-3 right-3">
            <Maximize2 className="w-3 h-3 text-white/40" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Section content shown in the preview ---------- */
function SectionContent({
  section, time, onOpenReel, locks, playing,
}: {
  section: SectionId;
  time: number;
  onOpenReel: (r: ReelItem) => void;
  locks: { skills: boolean; reel: boolean };
  playing: boolean;
}) {
  switch (section) {
    case "intro":
      return (
        <div key="intro" className="text-center animate-fade-in py-4">
          <div className="text-[10px] tracking-[0.5em] text-primary mb-8 whitespace-nowrap">
            VIDEO EDITOR / MEDIA CREATOR
          </div>
          <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            NGUYỄN<br />MINH ĐỨC
          </h1>
          <div className="mt-6 h-px w-24 bg-primary mx-auto" />
          <div className="mt-3 text-white/50 text-[11px]">SCENE 01 — INTRO · 00:00:00</div>
        </div>
      );
    case "about":
      return (
        <div key="about" className="max-w-xl animate-fade-in">
          <Tag>About</Tag>
          <p className="text-white/85 leading-relaxed mt-3 text-[13px]">
            Video editor và Media Creator với nền tảng <span className="text-primary">Công nghệ thông tin</span>,
            đam mê kể chuyện bằng hình ảnh và âm thanh. Tập trung tạo ra những sản phẩm
            chỉn chu, đúng mục tiêu và mang lại giá trị thực tế — luôn tối ưu để biến ý tưởng
            thành video một cách hiệu quả, thu hút.
          </p>
        </div>
      );
    case "education":
      return (
        <div key="edu" className="max-w-xl animate-fade-in">
          <Tag>Education</Tag>
          <div className="mt-4 flex items-start gap-4">
            <GraduationCap className="w-8 h-8 text-primary mt-1" />
            <div>
              <div className="text-white text-xl font-semibold">Ton Duc Thang University</div>
              <div className="text-white/60 text-[12px] mt-1">Computer Science — Year 3</div>
              <div className="text-white/40 text-[11px] mt-3 max-w-sm">
                Nền tảng CS giúp tiếp cận nhanh các workflow và công cụ mới trong post‑production.
              </div>
            </div>
          </div>
        </div>
      );
    case "skills":
      if (locks.skills) {
        return (
          <LockedPanel
            title="Khóa cảnh Skills"
            body="Để mở phần Skills, hãy tua nhanh bằng Speed 1.5x/2x hoặc zoom timeline lớn hơn 1x."
            hint="Gợi ý: dùng cụm Speed hoặc thanh Zoom ở thanh điều khiển bên dưới."
          />
        );
      }
      return (
        <div key="skills" className="w-full max-w-2xl animate-fade-in">
          <Tag>Skills</Tag>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <SkillCard icon={Wrench} title="Editing Suite" items={["Premiere Pro", "CapCut PC", "Final Cut Pro"]} />
            <SkillCard icon={Film} title="Story & Pacing" items={["Cắt ghép giữ chân", "SFX đúng lúc", "Sound design"]} />
            <SkillCard icon={Languages} title="English — Aptis C1" items={["185 / 200", "Tutorial & docs"]} />
            <SkillCard icon={Sparkles} title="Soft skills" items={["Team work", "Time mgmt", "Feedback‑driven"]} />
          </div>
        </div>
      );
    case "experience":
      return (
        <div key="exp" className="max-w-xl animate-fade-in">
          <Tag>Experience</Tag>
          <div className="mt-3 text-white text-lg font-semibold">
            Video Producer / Editor
          </div>
          <div className="text-white/50 text-[11px] mb-3">Các dự án học thuật & cuộc thi công nghệ</div>
          <ul className="space-y-2 text-[12px] text-white/80">
            <Bullet><b className="text-primary">Quản lý vòng đời video:</b> A–Z từ kịch bản, phân chia công việc, điều phối source, quay dựng.</Bullet>
            <Bullet><b className="text-primary">Pitching video:</b> giới thiệu dự án và sản phẩm công nghệ — súc tích, hấp dẫn trong thời gian ngắn.</Bullet>
          </ul>
        </div>
      );
    case "achievements":
      return (
        <div key="ach" className="max-w-xl animate-fade-in">
          <Tag>Achievement</Tag>
          <div className="mt-4 flex items-start gap-4">
            <Trophy className="w-10 h-10 text-primary mt-1" />
            <div>
              <div className="text-white text-xl font-semibold">Tech Startup Challenger</div>
              <div className="text-primary text-[12px] mt-0.5">TOP 4 CHUNG CUỘC · Vai trò: Trưởng nhóm</div>
              <div className="text-white/60 text-[12px] mt-3 max-w-sm leading-relaxed">
                Dẫn dắt đội ngũ phát triển sản phẩm khởi nghiệp. Vận dụng kỹ năng phân bố công việc,
                quản lý thời gian và điều phối dự án.
              </div>
            </div>
          </div>
        </div>
      );
    case "reel":
      if (locks.reel) {
        return (
          <LockedPanel
            title="Khóa cảnh Demo Reel"
            body="Để mở Reel.mov, hãy chọn công cụ Razor (phím C) và cắt một clip bất kỳ trên timeline."
            hint="Cắt xong, tua đến cảnh Reel và chọn video để xem."
          />
        );
      }
      return (
        <div key="reel" className="w-full max-w-3xl animate-fade-in" data-tutorial="reel">
          <div className="flex items-center justify-between">
            <Tag>Demo Reel</Tag>
            <span className="text-[10px] text-white/40 uppercase tracking-widest">4 projects · click to play</span>
          </div>
          <div className="relative mt-4">
            <div className="absolute -inset-2 rounded-xl border border-white/10 bg-[radial-gradient(120%_140%_at_20%_10%,_oklch(0.78_0.18_195_/_0.12)_0%,_transparent_55%),_radial-gradient(100%_120%_at_80%_100%,_oklch(0.62_0.18_255_/_0.12)_0%,_transparent_60%)]" />
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
              {reelItems.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onOpenReel(r)}
                  className="group relative rounded-md border border-white/10 overflow-hidden hover:border-primary transition-colors aspect-[4/3] bg-black/30"
                  title={r.title}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg`}
                    alt={r.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center scale-90 group-hover:scale-100 transition-transform shadow-lg">
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1.5 right-1.5 text-left">
                    <div className="text-[10px] text-white font-semibold truncate">{r.title}</div>
                    <div className="text-[9px] text-white/60 truncate">{r.category}</div>
                  </div>
                  {r.isShort && (
                    <div className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded bg-primary text-primary-foreground font-bold">
                      SHORT
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    case "interests":
      return (
        <div key="int" className="max-w-xl animate-fade-in">
          <Tag>Interests</Tag>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <SkillCard icon={Film} title="New Edit Styles" items={["Workflow mới", "Công nghệ mới"]} />
            <SkillCard icon={Dumbbell} title="Discipline" items={["Gym", "Chạy bộ"]} />
          </div>
        </div>
      );
    case "contact": {
      const t = Math.max(0, Math.min(1, (time - CONTACT_START) / CONTACT_RENDER_DURATION));
      const done = t >= 1;
      return (
        <div key="contact" className="w-full max-w-md animate-fade-in">
          <div className="text-[10px] tracking-[0.4em] text-primary mb-3">RENDERING OUTPUT…</div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-[width] duration-100" style={{ width: `${t * 100}%` }} />
          </div>
          <div className="mt-1 text-[10px] text-white/40 flex justify-between font-mono">
            <span>contact_card.mp4</span>
            <span>{Math.round(t * 100)}%</span>
          </div>

          {done ? (
            <div className="mt-6 p-5 border border-primary/40 rounded-md bg-primary/5">
              <div className="text-white text-2xl font-bold">Let&apos;s make something.</div>
              <div className="mt-4 space-y-2 text-[13px]">
                <div className="flex items-center gap-3 text-white/90"><Phone className="w-4 h-4 text-primary" /> 0909 882 906</div>
                <div className="flex items-center gap-3 text-white/90"><Mail className="w-4 h-4 text-primary" /> regret1505@gmail.com</div>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-[11px] text-white/50">
              Đang render… hoàn tất sẽ hiển thị thông tin liên lạc.
            </div>
          )}
        </div>
      );
    }
  }
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2 py-0.5 text-[10px] tracking-[0.3em] uppercase text-primary border border-primary/40 rounded-sm">
      {children}
    </span>
  );
}

function LockedPanel({
  title,
  body,
  hint,
}: { title: string; body: string; hint?: string }) {
  return (
    <div className="w-full max-w-xl text-center animate-fade-in">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
        <Lock className="w-5 h-5 text-primary" />
      </div>
      <div className="mt-4 text-white text-lg font-semibold">{title}</div>
      <p className="mt-2 text-white/70 text-[12px] leading-relaxed">{body}</p>
      {hint && <div className="mt-3 text-[11px] text-primary">{hint}</div>}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2"><span className="text-primary mt-1">▸</span><span>{children}</span></li>
  );
}

function SkillCard({
  icon: Icon, title, items,
}: { icon: typeof Film; title: string; items: string[] }) {
  return (
    <div className="border border-white/10 rounded-sm p-3 bg-white/[0.03]">
      <div className="flex items-center gap-2 text-primary text-[11px] uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      <ul className="mt-2 text-white/80 text-[12px] space-y-0.5">
        {items.map((i) => <li key={i}>· {i}</li>)}
      </ul>
    </div>
  );
}

/* ---------- Inspector (right) ---------- */
function Inspector({ clip, time }: { clip: Clip | undefined; time: number }) {
  return (
    <aside className="bg-panel flex flex-col min-h-0">
      <PanelHeader title="Inspector" />
      <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin">
        {clip ? (
          <>
            <div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Selected clip</div>
              <div className="text-foreground font-semibold mt-0.5 truncate">{clip.label}</div>
            </div>
            <Row label="Track" value={trackMeta[clip.track].label} />
            <Row label="In"    value={fmtTime(clip.start)} />
            <Row label="Out"   value={fmtTime(clip.start + clip.duration)} />
            <Row label="Dur"   value={`${clip.duration.toFixed(2)}s`} />
            <div className="pt-2 border-t border-border" />
            <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Effects</div>
            <SliderRow label="Opacity"  value={100} />
            <SliderRow label="Scale"    value={100} />
            <SliderRow label="Position" value={50} />
            <div className="pt-2 border-t border-border" />
          </>
        ) : (
          <div className="text-muted-foreground">No clip selected</div>
        )}
        <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Playhead</div>
        <Row label="Time" value={fmtTime(time)} />
        <Row label="Frame" value={Math.floor(time * 30).toString()} />
        <div className="pt-3 text-[10px] text-muted-foreground leading-relaxed">
          Tips: <span className="text-foreground">Space</span> play/pause ·
          {" "}<span className="text-foreground">V</span> select ·
          {" "}<span className="text-foreground">C</span> razor ·
          {" "}<span className="text-foreground">←/→</span> scrub
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-mono">{value}</span>
    </div>
  );
}

function SliderRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-mono">{value}</span>
      </div>
      <div className="h-1 bg-surface rounded-full mt-1 overflow-hidden">
        <div className="h-full bg-primary/70" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/* ---------- Transport bar ---------- */
function Transport({
  time, playing, onPlayPause, onPrev, onNext,
  tool, setTool, speed, setSpeed, zoom, setZoom,
}: {
  time: number;
  playing: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  tool: "select" | "razor";
  setTool: (t: "select" | "razor") => void;
  speed: number;
  setSpeed: (n: number) => void;
  zoom: number;
  setZoom: (n: number) => void;
}) {
  return (
    <div className="h-11 px-3 flex items-center gap-3 bg-panel border-y border-border">
      <div className="flex items-center gap-1">
        <ToolBtn active={tool === "select"} onClick={() => setTool("select")} title="Select (V)">
          <MousePointer2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn active={tool === "razor"} onClick={() => setTool("razor")} title="Razor (C) — cut a clip at playhead">
          <Scissors className="w-3.5 h-3.5" />
        </ToolBtn>
      </div>

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-1">
        <IconBtn onClick={onPrev} title="Prev clip"><SkipBack className="w-3.5 h-3.5" /></IconBtn>
        <button
          onClick={onPlayPause}
          className="h-7 w-9 rounded-sm bg-primary text-primary-foreground hover:brightness-110 flex items-center justify-center"
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>
        <IconBtn onClick={onNext} title="Next clip"><SkipForward className="w-3.5 h-3.5" /></IconBtn>
        <IconBtn onClick={() => { /* stop */ }} title="Stop"><SquareIcon className="w-3 h-3" /></IconBtn>
      </div>

      <div className="h-5 w-px bg-border" />

      <div className="font-mono text-foreground">{fmtTime(time)}</div>
      <div className="text-muted-foreground">/ {fmtTime(TOTAL)}</div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-muted-foreground">
        <Volume2 className="w-3.5 h-3.5" />
        <div className="w-24 h-1 bg-surface rounded-full"><div className="h-full w-3/4 bg-track-audio rounded-full" /></div>
      </div>

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">Speed</span>
        {[0.5, 1, 1.5, 2].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-1.5 py-0.5 rounded-sm ${speed === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {s}×
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Zoom</span>
        <input
          type="range" min={0.5} max={2.5} step={0.1} value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-24 accent-[oklch(0.78_0.18_195)]"
        />
      </div>
    </div>
  );
}

function ToolBtn({
  active, onClick, title, children,
}: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`h-7 w-7 rounded-sm flex items-center justify-center transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}
function IconBtn({
  onClick, title, children,
}: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-7 w-7 rounded-sm text-muted-foreground hover:text-foreground hover:bg-surface flex items-center justify-center"
    >
      {children}
    </button>
  );
}

/* ---------- Timeline ---------- */
function Timeline({
  clips, time, pxPerSec, timelineWidth, timelineRef,
  onMouseDown, onClipClick, tool, selectedClip,
}: {
  clips: Clip[];
  time: number;
  pxPerSec: number;
  timelineWidth: number;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  onMouseDown: (e: React.MouseEvent) => void;
  onClipClick: (c: Clip, e: React.MouseEvent) => void;
  tool: "select" | "razor";
  selectedClip: string | null;
}) {
  const trackHeight = 30;

  return (
    <div className="h-[260px] bg-panel border-t border-border flex min-h-0">
      {/* track labels */}
      <div className="w-[60px] shrink-0 border-r border-border bg-surface">
        <div className="h-7 border-b border-border" />
        {trackOrder.map((k) => {
          const Icon = trackMeta[k].icon;
          return (
            <div
              key={k}
              className="px-2 flex items-center gap-1.5 text-muted-foreground border-b border-border"
              style={{ height: trackHeight + 8 }}
            >
              <Icon className="w-3 h-3" />
              <span>{trackMeta[k].label}</span>
            </div>
          );
        })}
      </div>

      {/* timeline scroll area */}
      <div
        className={`flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin relative ${
          tool === "razor" ? "cursor-[crosshair]" : "cursor-default"
        }`}
        ref={timelineRef}
      >
        <div style={{ width: Math.max(timelineWidth, 800) }} className="relative">
          {/* ruler */}
          <Ruler totalSeconds={TOTAL} pxPerSec={pxPerSec} onMouseDown={onMouseDown} />

          {/* tracks */}
          <div onMouseDown={onMouseDown}>
            {trackOrder.map((k) => (
              <div
                key={k}
                className="relative border-b border-border bg-[oklch(0.2_0.005_270)]"
                style={{ height: trackHeight + 8 }}
              >
                {/* grid lines */}
                {Array.from({ length: TOTAL + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-border/40"
                    style={{ left: i * pxPerSec }}
                  />
                ))}
                {clips.filter((c) => c.track === k).map((c) => (
                  <ClipBlock
                    key={c.id}
                    clip={c}
                    pxPerSec={pxPerSec}
                    selected={selectedClip === c.id}
                    onClick={(e) => onClipClick(c, e)}
                    tool={tool}
                    height={trackHeight}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* playhead */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-10"
            style={{ left: time * pxPerSec }}
          >
            <div className="w-[2px] h-full bg-playhead shadow-[0_0_8px_var(--color-playhead)]" />
            <div className="absolute -top-0.5 -left-[6px] w-[14px] h-[10px] bg-playhead"
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Ruler({
  totalSeconds, pxPerSec, onMouseDown,
}: { totalSeconds: number; pxPerSec: number; onMouseDown: (e: React.MouseEvent) => void }) {
  const ticks: number[] = [];
  for (let i = 0; i <= totalSeconds; i++) ticks.push(i);
  return (
    <div
      className="h-7 border-b border-border bg-surface relative cursor-pointer"
      onMouseDown={onMouseDown}
    >
      {ticks.map((s) => (
        <div key={s} className="absolute top-0 bottom-0 flex flex-col items-start" style={{ left: s * pxPerSec }}>
          <div className={`w-px ${s % 5 === 0 ? "h-3 bg-foreground/60" : "h-2 bg-foreground/25"}`} />
          {s % 5 === 0 && (
            <span className="text-[9px] text-muted-foreground font-mono ml-1 -mt-0.5">
              00:{pad(s)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ClipBlock({
  clip, pxPerSec, selected, onClick, tool, height,
}: {
  clip: Clip; pxPerSec: number; selected: boolean;
  onClick: (e: React.MouseEvent) => void;
  tool: "select" | "razor"; height: number;
}) {
  const left = clip.start * pxPerSec;
  const width = clip.duration * pxPerSec;
  const color = `var(${trackMeta[clip.track].varName})`;
  const isAudio = clip.track === "audio";

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className={`absolute top-1 rounded-sm overflow-hidden border transition-shadow ${
        selected ? "border-foreground shadow-[0_0_0_1px_oklch(0.78_0.18_195)]" : "border-black/30"
      } ${tool === "razor" ? "cursor-[crosshair]" : "cursor-pointer"}`}
      style={{
        left, width, height,
        background: `color-mix(in oklab, ${color} 35%, oklch(0.22 0.006 270))`,
      }}
      title={clip.label}
    >
      <div className="h-1 w-full" style={{ background: color }} />
      <div className="px-1.5 py-0.5 text-[10px] truncate text-foreground/90 font-mono">
        {clip.label}
      </div>
      {isAudio && (
        <svg className="absolute bottom-0 left-0 right-0 h-3 w-full opacity-60" preserveAspectRatio="none" viewBox="0 0 100 10">
          <path
            d={`M0 5 ${Array.from({ length: 50 }).map((_, i) => {
              const h = 1 + Math.abs(Math.sin(i * 0.7 + clip.start)) * 4;
              return `L ${i * 2} ${5 - h} L ${i * 2} ${5 + h}`;
            }).join(" ")}`}
            stroke={color as string}
            strokeWidth={0.5}
            fill="none"
          />
        </svg>
      )}
    </div>
  );
}

/* ---------- Reel Modal ---------- */
function ReelModal({ item, onClose }: { item: ReelItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const embed = item.isShort
    ? `https://www.youtube.com/embed/${item.youtubeId}?autoplay=1&rel=0`
    : `https://www.youtube.com/embed/${item.youtubeId}?autoplay=1&rel=0`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-primary">{item.category}</div>
            <div className="text-white text-lg font-semibold">{item.title}</div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          className={`relative w-full bg-black rounded-lg overflow-hidden border border-white/10 mx-auto ${
            item.isShort ? "max-w-[420px] aspect-[9/16]" : "aspect-video"
          }`}
        >
          <iframe
            src={embed}
            title={item.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerated-sensors; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="mt-2 text-[10px] text-white/40 text-center font-mono">
          ESC để đóng — quay lại timeline.
        </div>
      </div>
    </div>
  );
}


