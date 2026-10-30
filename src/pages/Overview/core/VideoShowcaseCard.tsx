// src/pages/overview/core/VideoShowcaseCard.tsx
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion";
import {
    MediaPlayer,
    MediaProvider,
    Controls,
    PlayButton,
    SeekButton,
    TimeSlider,
    useMediaState,
    useMediaRemote,
} from "@vidstack/react";
import "@vidstack/react/player/styles/base.css";
import {
    IoPlay,
    IoPause,
    IoPlayBack,
    IoPlayForward,
    IoEllipsisHorizontal,
    IoVolumeHigh,
    IoVolumeMedium,
    IoVolumeMute,
    IoSunny,
    IoExpand,
} from "react-icons/io5";

interface VideoShowcaseCardProps {
    videoUrl: string; // mp4 / m3u8 / YouTube link
    width?: number;
    height?: number;
}

const GAP = 0;
const MAX_PULL = 8;

const FOLLOW = { stiffness: 260, damping: 26, mass: 0.8 };
const NEIGHBOUR = { stiffness: 200, damping: 24, mass: 0.9 };

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const soft = (v: number, max = MAX_PULL) => max * Math.tanh(v / (max * 6));
const softXY = (x: number, y: number, max = MAX_PULL) => {
    const d = Math.hypot(x, y);
    if (d === 0) return { x: 0, y: 0 };
    const k = soft(d, max) / d;
    return { x: x * k, y: y * k };
};

/* 🧊 iOS liquid glass */
const GLASS =
    "bg-white/15 backdrop-blur-xl backdrop-saturate-150 border border-white/30 " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(255,255,255,0.1),0_8px_22px_rgba(0,0,0,0.35)]";

const BTN =
    "flex size-full items-center justify-center rounded-full text-white outline-none cursor-pointer " +
    "transition-colors duration-300 ease-out hover:bg-white/10 active:bg-white/25";

/* brightness level (0..1) -> css brightness (0.35..1.65), 0.5 = normal */
const levelToFilter = (l: number) => 0.35 + l * 1.3;

type Pull = { x: MotionValue<number>; y: MotionValue<number>; k: number };

/* ---------------------------------------------------------------- */
/* 3 glass buttons (back / play / forward)                           */
/* ---------------------------------------------------------------- */
function GlassSlot({
    size,
    x,
    y,
    pullFrom,
    z = 1,
    children,
}: {
    size: number;
    x: MotionValue<number>;
    y: MotionValue<number>;
    pullFrom: Pull[];
    z?: number;
    children: ReactNode;
}) {
    const sources = [...pullFrom.map((p) => p.x), ...pullFrom.map((p) => p.y)];

    const neighbourVec = (vals: number[]) => {
        const n = pullFrom.length;
        let sx = 0;
        let sy = 0;
        pullFrom.forEach((p, i) => {
            sx += vals[i] * p.k;
            sy += vals[n + i] * p.k;
        });
        return softXY(sx, sy);
    };

    const nxRaw = useTransform(sources, (vals: number[]) => neighbourVec(vals).x);
    const nyRaw = useTransform(sources, (vals: number[]) => neighbourVec(vals).y);
    const nx = useSpring(nxRaw, NEIGHBOUR);
    const ny = useSpring(nyRaw, NEIGHBOUR);

    const oxRaw = useTransform([x, y], ([vx, vy]: number[]) => softXY(vx, vy).x);
    const oyRaw = useTransform([x, y], ([vx, vy]: number[]) => softXY(vx, vy).y);
    const ox = useSpring(oxRaw, FOLLOW);
    const oy = useSpring(oyRaw, FOLLOW);

    const scale = useTransform(
        [ox, oy],
        ([vx, vy]: number[]) => 1 + Math.min(Math.hypot(vx, vy) / 80, 0.1)
    );

    const release = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            style={{ x: nx, y: ny, zIndex: z }}
            className="pointer-events-none relative shrink-0"
        >
            <motion.div
                onPan={(_, info) => {
                    x.set(info.offset.x);
                    y.set(info.offset.y);
                }}
                onPanEnd={release}
                onPointerUp={release}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                style={{ x: ox, y: oy, scale, width: size, height: size }}
                className={`pointer-events-auto cursor-grab touch-none rounded-full active:cursor-grabbing ${GLASS}`}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

function GlassControls() {
    const paused = useMediaState("paused");
    const bx = useMotionValue(0);
    const by = useMotionValue(0);
    const px = useMotionValue(0);
    const py = useMotionValue(0);
    const fx = useMotionValue(0);
    const fy = useMotionValue(0);

    return (
        <div className="flex items-center justify-center" style={{ gap: GAP }}>
            <GlassSlot
                size={50}
                x={bx}
                y={by}
                z={1}
                pullFrom={[
                    { x: px, y: py, k: 0.6 },
                    { x: fx, y: fy, k: 0.25 },
                ]}
            >
                <SeekButton seconds={-10} className={BTN}>
                    <IoPlayBack size={20} className="drop-shadow" />
                </SeekButton>
            </GlassSlot>

            <GlassSlot
                size={66}
                x={px}
                y={py}
                z={2}
                pullFrom={[
                    { x: bx, y: by, k: 0.5 },
                    { x: fx, y: fy, k: 0.5 },
                ]}
            >
                <PlayButton className={BTN}>
                    {paused ? (
                        <IoPlay size={28} className="translate-x-0.5 drop-shadow-md" />
                    ) : (
                        <IoPause size={28} className="drop-shadow-md" />
                    )}
                </PlayButton>
            </GlassSlot>

            <GlassSlot
                size={50}
                x={fx}
                y={fy}
                z={1}
                pullFrom={[
                    { x: px, y: py, k: 0.6 },
                    { x: bx, y: by, k: 0.25 },
                ]}
            >
                <SeekButton seconds={10} className={BTN}>
                    <IoPlayForward size={20} className="drop-shadow" />
                </SeekButton>
            </GlassSlot>
        </div>
    );
}

/* ---------------------------------------------------------------- */
/* ⋯ Top-left 3 dot glass menu                                       */
/* ---------------------------------------------------------------- */
const SPEEDS = [0.5, 1, 1.5, 2];

function TopMenu() {
    const remote = useMediaRemote();
    const muted = useMediaState("muted");
    const rate = useMediaState("playbackRate");
    const [open, setOpen] = useState(false);

    return (
        <div className="pointer-events-auto absolute left-3 top-3 z-20">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`flex size-10 items-center justify-center rounded-full text-white outline-none transition-all duration-200 active:scale-90 ${GLASS}`}
            >
                <IoEllipsisHorizontal size={20} />
            </button>

            <motion.div
                initial={false}
                animate={
                    open
                        ? { opacity: 1, scale: 1, y: 0, pointerEvents: "auto" }
                        : { opacity: 0, scale: 0.9, y: -6, pointerEvents: "none" }
                }
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                style={{ originX: 0, originY: 0 }}
                className={`absolute left-0 top-12 w-52 rounded-3xl p-2 text-white ${GLASS}`}
            >
                <button
                    type="button"
                    onClick={() => {
                        if (muted) remote.unmute();
                        else remote.mute();
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-white/15"
                >
                    {muted ? <IoVolumeMute size={18} /> : <IoVolumeHigh size={18} />}
                    {muted ? "Unmute" : "Mute"}
                </button>

                <div className="flex items-center gap-1 px-2 py-2">
                    {SPEEDS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => remote.changePlaybackRate(s)}
                            className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-colors ${rate === s ? "bg-white/30" : "hover:bg-white/15"
                                }`}
                        >
                            {s}x
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => {
                        remote.toggleFullscreen();
                        setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-white/15"
                >
                    <IoExpand size={18} />
                    Fullscreen
                </button>
            </motion.div>
        </div>
    );
}

/* ---------------------------------------------------------------- */
/* Controls overlay                                                  */
/* ---------------------------------------------------------------- */
function ControlsLayer() {
    return (
        <Controls.Root className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 ease-out data-[visible]:opacity-100">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/50 to-transparent" />

            <TopMenu />

            <Controls.Group className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <GlassControls />
            </Controls.Group>

            <Controls.Group className="pointer-events-auto absolute inset-x-0 bottom-0 px-5 pb-3.5">
                <TimeSlider.Root className="group relative flex h-6 w-full cursor-pointer touch-none select-none items-center">
                    <TimeSlider.Track className="relative h-[4px] w-full rounded-full bg-white/25 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-data-[active]:h-[9px]">
                        <TimeSlider.Progress className="absolute h-full w-[var(--slider-progress)] rounded-full bg-white/30" />
                        <TimeSlider.TrackFill className="absolute h-full w-[var(--slider-fill)] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                    </TimeSlider.Track>

                    <TimeSlider.Thumb
                        className="absolute left-[var(--slider-fill)] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white
                            shadow-[0_2px_10px_rgba(0,0,0,0.45)]
                            transition-[width,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)]
                            group-data-[active]:w-8 group-data-[active]:scale-100"
                    />
                </TimeSlider.Root>
            </Controls.Group>
        </Controls.Root>
    );
}

/* ---------------------------------------------------------------- */
/* Gesture layer: swipe/wheel/keys -> volume (right) & brightness (left) */
/* ---------------------------------------------------------------- */
type Indicator = { kind: "volume" | "brightness"; value: number };

function GestureLayer({
    brightness,
    setBrightness,
}: {
    brightness: number;
    setBrightness: (v: number) => void;
}) {
    const remote = useMediaRemote();
    const volume = useMediaState("volume");
    const muted = useMediaState("muted");

    const layerRef = useRef<HTMLDivElement>(null);
    const hovered = useRef(false);
    const drag = useRef<{
        side: "left" | "right";
        startY: number;
        startVal: number;
        moved: boolean;
    } | null>(null);
    const timer = useRef<number | undefined>(undefined);
    const [ind, setInd] = useState<Indicator | null>(null);

    const volLevel = muted ? 0 : volume;
    const latest = useRef({ volLevel, brightness });
    latest.current = { volLevel, brightness };

    const show = (kind: Indicator["kind"], value: number) => {
        setInd({ kind, value });
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setInd(null), 900);
    };

    const setVol = (v: number) => {
        const val = clamp(v);
        remote.changeVolume(val);
        if (val > 0) remote.unmute();
        else remote.mute();
        show("volume", val);
    };

    const setBri = (v: number) => {
        const val = clamp(v);
        setBrightness(val);
        show("brightness", val);
    };

    const sideOf = (clientX: number): "left" | "right" => {
        const rect = layerRef.current!.getBoundingClientRect();
        return clientX - rect.left < rect.width / 2 ? "left" : "right";
    };

    const onPointerDown = (e: React.PointerEvent) => {
        const side = sideOf(e.clientX);
        drag.current = {
            side,
            startY: e.clientY,
            startVal: side === "right" ? latest.current.volLevel : latest.current.brightness,
            moved: false,
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const d = drag.current;
        if (!d) return;
        const dy = d.startY - e.clientY;
        if (!d.moved && Math.abs(dy) < 8) return;
        d.moved = true;
        const h = layerRef.current!.getBoundingClientRect().height;
        const next = d.startVal + (dy / h) * 1.1;
        if (d.side === "right") setVol(next);
        else setBri(next);
    };

    const onPointerUp = () => {
        const d = drag.current;
        drag.current = null;
        if (!d || d.moved) return;
        // simple tap: play/pause + unmute (browser sound allow kare)
        remote.togglePaused();
        if (muted) {
            if (volume === 0) remote.changeVolume(0.6);
            remote.unmute();
        }
    };

    // 🖱️ wheel (PC) – left = brightness, right = volume
    useEffect(() => {
        const el = layerRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const step = e.deltaY < 0 ? 0.05 : -0.05;
            if (sideOf(e.clientX) === "right") setVol(latest.current.volLevel + step);
            else setBri(latest.current.brightness + step);
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ⌨️ Arrow Up/Down (PC) – hover karo tyare volume
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!hovered.current) return;
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setVol(latest.current.volLevel + 0.05);
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setVol(latest.current.volLevel - 0.05);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const VolIcon =
        volLevel === 0 ? IoVolumeMute : volLevel < 0.5 ? IoVolumeMedium : IoVolumeHigh;

    return (
        <>
            <div
                ref={layerRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => (drag.current = null)}
                onPointerEnter={() => (hovered.current = true)}
                onPointerLeave={() => (hovered.current = false)}
                onDoubleClick={() => remote.toggleFullscreen()}
                className="absolute inset-0 z-0 touch-none select-none"
            />

            {/* 🔇 muted hoy tyare: tap karo = sound on */}
            {muted && (
                <button
                    type="button"
                    onClick={() => {
                        if (volume === 0) remote.changeVolume(0.6);
                        remote.unmute();
                    }}
                    className={`absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full text-white transition-all duration-200 active:scale-90 ${GLASS}`}
                >
                    <IoVolumeMute size={20} />
                </button>
            )}

            {/* 📊 glass level indicator */}
            {ind && (
                <div
                    className={`pointer-events-none absolute top-1/2 z-20 flex h-44 w-12 -translate-y-1/2 flex-col items-center justify-between rounded-full px-1 py-3 text-white ${GLASS} ${ind.kind === "volume" ? "right-4" : "left-4"
                        }`}
                >
                    <div className="relative w-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
                        <div
                            className="absolute inset-x-0 bottom-0 rounded-full bg-white transition-[height] duration-100"
                            style={{ height: `${ind.value * 100}%` }}
                        />
                    </div>
                    <div className="mt-2">
                        {ind.kind === "volume" ? <VolIcon size={18} /> : <IoSunny size={18} />}
                    </div>
                </div>
            )}
        </>
    );
}

/* ---------------------------------------------------------------- */
export default function VideoShowcaseCard({
    videoUrl,
    width = 800,
    height = 450,
}: VideoShowcaseCardProps) {
    const isYouTube = /youtu\.?be/.test(videoUrl);
    const [brightness, setBrightness] = useState(0.5); // 0.5 = normal

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
                width,
                height,
                maxWidth: "calc(100vw - 48px)",
                maxHeight: "calc(100vh - 48px)",
            }}
            className="fixed bottom-6 right-6 z-40 overflow-hidden rounded-[28px] bg-black ring-1 ring-white/15
                shadow-[0_30px_80px_-10px_rgba(0,0,0,0.65),0_12px_30px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]"
        >
            <MediaPlayer
                src={videoUrl}
                autoPlay
                muted
                loop
                playsInline
                style={{ ["--vb" as string]: levelToFilter(brightness) }}
                className={`gurukul-player ${isYouTube ? "gurukul-yt" : ""}`}
            >
                <MediaProvider />

                <GestureLayer brightness={brightness} setBrightness={setBrightness} />
                <ControlsLayer />
            </MediaPlayer>
        </motion.div>
    );
}