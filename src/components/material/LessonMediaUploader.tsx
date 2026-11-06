import { useId, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileAudio, FileImage, FileText, FileVideo, UploadCloud } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";

interface LessonMediaUploaderProps {
  lessonType: string;
  onFileChange?: (file: File | null) => void;
  label?: string;
}

const mediaTypeConfig: Record<string, { label: string; accept: string; icon: typeof FileVideo; helper: string }> = {
  video: {
    label: "Video",
    accept: "video/*",
    icon: FileVideo,
    helper: "Upload a video file for this lesson",
  },
  audio: {
    label: "Audio",
    accept: "audio/*",
    icon: FileAudio,
    helper: "Upload a voice note or audio lesson",
  },
  image: {
    label: "Image",
    accept: "image/*",
    icon: FileImage,
    helper: "Upload a lesson image or cover graphic",
  },
  document: {
    label: "Document",
    accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt",
    icon: FileText,
    helper: "Upload a PDF, document, or presentation",
  },
};

export default function LessonMediaUploader({ lessonType, onFileChange, label = "Lesson Media" }: LessonMediaUploaderProps) {
  const { theme } = useTheme();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const config = useMemo(() => mediaTypeConfig[lessonType] ?? mediaTypeConfig.document, [lessonType]);
  const Icon = config.icon;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    onFileChange?.(file);
    event.target.value = "";
  };

  const clearSelection = () => {
    setSelectedFile(null);
    onFileChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <label htmlFor={inputId} className={`mb-1.5 block text-sm font-medium ${theme ? "text-white/80" : "text-neutral-700"}`}>{label}</label>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Select ${config.label.toLowerCase()} file`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`group cursor-pointer rounded-2xl border border-dashed p-5 transition-all duration-200 focus-within:ring-2 ${theme ? "border-blue-400/50 bg-blue-500/5 hover:border-blue-400 hover:bg-blue-500/10 focus-within:ring-blue-400" : "border-red-300 bg-red-50/60 hover:border-red-400 hover:bg-red-50 focus-within:ring-red-400"}`}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme ? "bg-blue-500/10 text-blue-300" : "bg-red-500/10 text-red-500"}`}>
            <Icon className="h-7 w-7" />
          </div>

          <div>
            <p className={`text-base font-semibold ${theme ? "text-white" : "text-neutral-900"}`}>{config.label} upload</p>
            <p className={`mt-1 text-sm ${theme ? "text-gray-400" : "text-neutral-500"}`}>{config.helper}</p>
          </div>

          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${theme ? "border-blue-400/30 bg-blue-500/10 text-blue-200" : "border-red-400/30 bg-red-500/10 text-red-700"}`}>
            <UploadCloud className="h-3.5 w-3.5" />
            Select file
          </div>
        </div>

        <input id={inputId} ref={inputRef} type="file" accept={config.accept} onChange={handleChange} className="hidden" />
      </div>

      {selectedFile ? (
        <div className={`mt-3 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${theme ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-emerald-500/30 bg-emerald-50 text-emerald-700"}`}>
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{selectedFile.name}</span>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="rounded-md px-2 py-1 text-xs font-medium transition hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}
