import { useCallback, useEffect, useRef, useState } from "react";
import { FaMicrophone, FaPause, FaPlay, FaStop } from "react-icons/fa";
import { useTheme } from "../theme/ThemeContext";

type RecorderState = "idle" | "recording" | "paused" | "recorded";

const MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function getRecordingError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Microphone permission was denied. Allow microphone access and try again.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No microphone was found. Connect a microphone and try again.";
  }
  }
  return "We couldn't access the microphone. Check your browser settings and try again.";
}

interface AudioRecorderCardProps {
  onRecorded: (file: File | null) => void;
  disabled?: boolean;
}

export default function AudioRecorderCard({ onRecorded, disabled = false }: AudioRecorderCardProps) {
  const { theme } = useTheme();
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const previewRef = useRef<HTMLAudioElement>(null);
  const meterBarsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const elapsedBeforePauseRef = useRef(0);
  const recordingUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const stopMeterAndStream = useCallback(async () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      await audioContextRef.current.close();
    }
    audioContextRef.current = null;
    meterBarsRef.current.forEach((bar) => {
      if (bar) bar.style.height = "8%";
    });
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const startMeter = (stream: MediaStream) => {
    const AudioContextConstructor = window.AudioContext;
    const audioContext = new AudioContextConstructor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = audioContext;
    const values = new Uint8Array(analyser.fftSize);

    const draw = () => {
      analyser.getByteTimeDomainData(values);
      let sum = 0;
      values.forEach((value) => {
        const normalized = (value - 128) / 128;
        sum += normalized * normalized;
      });
      const level = Math.min(Math.sqrt(sum / values.length) * 5, 1);
      meterBarsRef.current.forEach((bar, index) => {
        if (!bar) return;
        const wave = Math.abs(Math.sin(index * 0.62 + performance.now() / 170));
        bar.style.height = `${Math.max(8, 8 + level * (24 + wave * 68))}%`;
      });
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  const startRecording = async () => {
    setErrorMessage("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErrorMessage("Audio recording isn't supported by this browser. Try a recent version of Chrome, Edge, or Firefox.");
      return;
    }
    if (typeof window.AudioContext === "undefined") {
      setErrorMessage("Audio recording isn't supported by this browser. Try a recent version of Chrome, Edge, or Firefox.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const mimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) {
        await stopMeterAndStream();
        setErrorMessage("This browser doesn't support a compatible audio recording format.");
        return;
      }
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];
      elapsedBeforePauseRef.current = 0;
      setElapsedSeconds(0);
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        void stopMeterAndStream();
        const actualMimeType = recorder.mimeType || mimeType || "audio/webm";
        const extension = actualMimeType.includes("mp4")
          ? "m4a"
          : actualMimeType.includes("ogg")
            ? "ogg"
            : "webm";
        const file = new File(chunksRef.current, `recording-${Date.now()}.${extension}`, {
          type: actualMimeType,
        });
        const url = URL.createObjectURL(file);
        if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
        recordingUrlRef.current = url;
        if (isMountedRef.current) {
          setRecordingUrl(url);
          setState("recorded");
          onRecorded(file);
        } else {
          URL.revokeObjectURL(url);
        }
      });
      startMeter(stream);
      recorder.start();
      startedAtRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(
          Math.floor((elapsedBeforePauseRef.current + Date.now() - startedAtRef.current) / 1000)
        );
      }, 250);
      setState("recording");
    } catch (error: unknown) {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      await stopMeterAndStream();
      if (isMountedRef.current) {
        setErrorMessage(getRecordingError(error));
        setState("idle");
      }
    }
  };

  const togglePause = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (state === "recording" && recorder.state === "recording") {
      recorder.pause();
      elapsedBeforePauseRef.current += Date.now() - startedAtRef.current;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
      setState("paused");
    } else if (state === "paused" && recorder.state === "paused") {
      recorder.resume();
      startedAtRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(
          Math.floor((elapsedBeforePauseRef.current + Date.now() - startedAtRef.current) / 1000)
        );
      }, 250);
      setState("recording");
    }
  };

  const recordAgain = async () => {
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    recordingUrlRef.current = null;
    setRecordingUrl(null);
    onRecorded(null);
    setPreviewProgress(0);
    setPreviewDuration(0);
    setElapsedSeconds(0);
    setState("idle");
    await startRecording();
  };

  useEffect(() => {
    isMountedRef.current = true;
    const preview = previewRef.current;
    return () => {
      isMountedRef.current = false;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      void stopMeterAndStream();
      preview?.pause();
      if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
      recordingUrlRef.current = null;
    };
  }, [stopMeterAndStream]);

  const surface = theme
    ? "border-white/10 bg-white/5 text-white backdrop-blur-xl"
    : "border-neutral-200 bg-white/80 text-neutral-900 backdrop-blur-xl";
  const muted = theme ? "text-white/60" : "text-neutral-500";
  const progress = previewDuration > 0 ? (previewProgress / previewDuration) * 100 : 0;

  return (
    <section
      aria-label="Audio recorder"
      className={`w-full rounded-3xl border p-6 shadow-xl sm:p-8 ${surface}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${muted}`}>Audio studio</p>
          <h3 className="mt-1 text-xl font-bold">Record your response</h3>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${theme ? "border-white/10 bg-white/5" : "border-neutral-200 bg-white"}`}>
          {state === "recording" ? (
            <span className="h-2 w-2 animate-pulse motion-reduce:animate-none rounded-full bg-red-500" />
          ) : (
            <span className={`h-2 w-2 rounded-full ${state === "paused" ? "bg-amber-400" : "bg-emerald-500"}`} />
          )}
          {state === "recording" ? "Recording" : state === "paused" ? "Paused" : "Ready"}
        </span>
      </div>

      <div className="mt-8 text-center">
        <p className="font-mono text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">
          {formatTime(elapsedSeconds)}
        </p>
        <p className={`mt-2 text-sm ${muted}`}>
          {state === "recording" ? "Speak clearly into your microphone" : "Your recording stays attached to this submission"}
        </p>
      </div>

      <div role="img" className="mt-8 flex h-24 items-center justify-center gap-1.5" aria-label="Live microphone level">
        {Array.from({ length: 24 }, (_, index) => (
          <span
            key={index}
            ref={(element) => {
              meterBarsRef.current[index] = element;
            }}
            className={`h-[8%] w-1.5 rounded-full transition-[height] duration-75 sm:w-2 ${state === "recording" ? "bg-red-500" : theme ? "bg-blue-400/60" : "bg-red-400/60"}`}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {state === "idle" && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void startRecording()}
            aria-label="Start recording"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition hover:scale-105 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400/50 disabled:opacity-50"
          >
            <FaMicrophone className="h-6 w-6" />
          </button>
        )}
        {(state === "recording" || state === "paused") && (
          <>
            <button type="button" onClick={togglePause} className={`flex h-12 w-12 items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-2 ${theme ? "border-white/15 bg-white/10 hover:bg-white/15 focus-visible:ring-blue-400" : "border-neutral-200 bg-white hover:bg-neutral-50 focus-visible:ring-red-400"}`} aria-label={state === "recording" ? "Pause recording" : "Resume recording"}>
              {state === "recording" ? <FaPause /> : <FaPlay />}
            </button>
            <button type="button" onClick={stopRecording} className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400/50" aria-label="Stop recording">
              <FaStop className="h-5 w-5" />
            </button>
          </>
        )}
        {state === "recorded" && recordingUrl && (
          <div className="flex w-full max-w-md flex-col gap-3">
            <audio
              ref={previewRef}
              src={recordingUrl}
              onTimeUpdate={(event) => setPreviewProgress(event.currentTarget.currentTime)}
              onLoadedMetadata={(event) => setPreviewDuration(event.currentTarget.duration)}
              onPlay={() => setIsPreviewPlaying(true)}
              onPause={() => setIsPreviewPlaying(false)}
              onEnded={() => {
                setIsPreviewPlaying(false);
                setPreviewProgress(0);
              }}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const audio = previewRef.current;
                  if (!audio) return;
                  if (audio.paused) void audio.play();
                  else audio.pause();
                }}
                aria-label={isPreviewPlaying ? "Pause recording preview" : "Play recording preview"}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${theme ? "bg-blue-500 text-white" : "bg-red-500 text-white"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
              >
                {isPreviewPlaying ? <FaPause /> : <FaPlay className="ml-0.5" />}
              </button>
              <div className={`h-2 flex-1 overflow-hidden rounded-full ${theme ? "bg-white/10" : "bg-neutral-200"}`}>
                <div className={`h-full rounded-full ${theme ? "bg-blue-400" : "bg-red-500"}`} style={{ width: `${progress}%` }} />
              </div>
              <span className={`text-xs tabular-nums ${muted}`}>{formatTime(previewProgress)}</span>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void recordAgain()}
              className={`self-center rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${theme ? "border-white/15 hover:bg-white/10 focus-visible:ring-blue-400" : "border-neutral-200 hover:bg-neutral-50 focus-visible:ring-red-400"}`}
            >
              Record again
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </section>
  );
}
