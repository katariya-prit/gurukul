import { memo, useEffect, useMemo, useRef, useState } from "react";
import { IoCheckmark, IoClose } from "react-icons/io5";
import {
  CHAT_THEMES,
  CHAT_THEME_CATEGORIES,
  getChatTheme,
  type ChatTheme,
  type ChatThemeCategory,
} from "./chatThemes";

interface ChatThemePickerProps {
  open: boolean;
  dark: boolean;
  selectedId: string;
  applyToAll: boolean;
  onSelect(id: string): void;
  onApplyToAllChange(value: boolean): void;
  onReset(): void;
  onClose(): void;
}

type CategoryFilter = "all" | ChatThemeCategory;

function ChatThemePicker({
  open,
  dark,
  selectedId,
  applyToAll,
  onSelect,
  onApplyToAllChange,
  onReset,
  onClose,
}: ChatThemePickerProps) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  // mounted = rendered in DOM, shown = slid into view (lets the close animation play)
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const t1 = window.setTimeout(() => setMounted(true), 0);
      const t2 = window.setTimeout(() => setShown(true), 30);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    const t1 = window.setTimeout(() => setShown(false), 0);
    const t2 = window.setTimeout(() => setMounted(false), 330);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [open]);

  const visibleThemes = useMemo(
    () => (category === "all" ? CHAT_THEMES : CHAT_THEMES.filter((t) => t.category === category)),
    [category]
  );

  const currentVariant = useMemo(() => {
    const t = getChatTheme(selectedId);
    return dark ? t.dark : t.light;
  }, [selectedId, dark]);

  if (!mounted) return null;

  const changeCategory = (next: CategoryFilter) => {
    setCategory(next);
    gridRef.current?.scrollTo({ top: 0 });
  };

  const renderTheme = (chatTheme: ChatTheme) => {
    const variant = dark ? chatTheme.dark : chatTheme.light;
    const selected = chatTheme.id === selectedId;

    return (
      <button
        key={chatTheme.id}
        type="button"
        tabIndex={open ? 0 : -1}
        aria-pressed={selected}
        title={`${chatTheme.name} · ${chatTheme.tagline}`}
        onClick={() => onSelect(chatTheme.id)}
        className="group min-w-0 rounded-2xl p-1 text-left transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          outlineColor: variant.accent,
          boxShadow: selected ? `0 0 0 2px ${variant.accent}` : undefined,
        }}
      >
        <span
          className="relative flex aspect-3/4 flex-col justify-end overflow-hidden rounded-2xl border p-2.5 shadow-sm transition-shadow duration-200 group-hover:shadow-lg"
          style={{ ...variant.wallpaper, borderColor: `${variant.accent}40` }}
        >
          <span
            className="mb-1.5 max-w-[88%] self-start rounded-xl rounded-bl-sm px-2 py-1 text-[8px] leading-tight shadow-sm"
            style={{
              background: variant.theirs.background,
              color: variant.theirs.color,
              border: variant.theirs.border,
            }}
          >
            A calm moment.
          </span>
          <span
            className="max-w-[88%] self-end rounded-xl rounded-br-sm px-2 py-1 text-[8px] leading-tight shadow-sm"
            style={{
              background: variant.mine.background,
              color: variant.mine.color,
            }}
          >
            With pleasure.
          </span>
          <span
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-white transition duration-200"
            style={{
              backgroundColor: variant.accent,
              opacity: selected ? 1 : 0,
              transform: selected ? "scale(1)" : "scale(0.65)",
            }}
          >
            <IoCheckmark aria-hidden="true" className="text-xs" />
          </span>
        </span>
        <span
          className={`mt-1.5 block truncate px-1 text-[11px] font-semibold ${
            dark ? "text-slate-100" : "text-slate-800"
          }`}
        >
          {chatTheme.name}
        </span>
        <span
          className={`block truncate px-1 text-[9px] font-medium ${
            dark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {chatTheme.tagline}
        </span>
      </button>
    );
  };

  const tabs: { id: CategoryFilter; label: string }[] = [{ id: "all", label: "All" }, ...CHAT_THEME_CATEGORIES];

  return (
    <div
      aria-hidden={!open}
      className={`absolute inset-0 z-30 overflow-clip transition-opacity duration-300 ${
        shown ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close chat theme picker"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-slate-950/25 backdrop-blur-[2px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-theme-picker-title"
        className={`absolute inset-x-0 bottom-0 flex flex-col overflow-clip rounded-t-3xl border backdrop-blur-2xl ${
          shown ? "translate-y-0" : "translate-y-full"
        } ${
          dark
            ? "border-slate-700/80 bg-slate-950/90 text-slate-100 shadow-[0_-20px_70px_rgba(0,0,0,0.5)]"
            : "border-white/80 bg-white/90 text-slate-900 shadow-[0_-20px_70px_rgba(15,23,42,0.2)]"
        }`}
        style={{
          height: "min(78%, 620px)",
          maxHeight: "78%",
          transition: "transform 300ms cubic-bezier(.2,.8,.2,1)",
        }}
      >
        {/* Header */}
        <div className="shrink-0 px-4 pb-2 pt-3">
          <div
            aria-hidden="true"
            className={`mx-auto mb-3 h-1 w-10 rounded-full ${dark ? "bg-slate-500/70" : "bg-slate-300"}`}
          />
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 id="chat-theme-picker-title" className="text-sm font-bold tracking-wide">
                Chat Theme
              </h2>
              <p className={`text-[10px] font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {dark ? "Dark" : "Light"} mode
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat theme picker"
              tabIndex={open ? 0 : -1}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                dark
                  ? "text-slate-300 hover:bg-slate-800 focus-visible:outline-slate-300"
                  : "text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-600"
              }`}
            >
              <IoClose aria-hidden="true" className="text-lg" />
            </button>
          </div>

          {/* Category tabs */}
          <div
            role="tablist"
            aria-label="Theme categories"
            className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => {
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={open ? 0 : -1}
                  onClick={() => changeCategory(tab.id)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    active
                      ? "border-transparent text-white"
                      : dark
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                  style={
                    active
                      ? { background: currentVariant.accentGradient, outlineColor: currentVariant.accent }
                      : { outlineColor: currentVariant.accent }
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme grid */}
        <div
          ref={gridRef}
          className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-1 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4">{visibleThemes.map(renderTheme)}</div>
        </div>

        {/* Footer */}
        <footer
          className={`flex shrink-0 items-center justify-between gap-3 border-t px-4 py-3 ${
            dark ? "border-slate-700/80" : "border-slate-200/80"
          }`}
        >
          <button
            type="button"
            role="switch"
            aria-checked={applyToAll}
            onClick={() => onApplyToAllChange(!applyToAll)}
            tabIndex={open ? 0 : -1}
            className="flex min-w-0 items-center gap-2.5 rounded-lg text-left text-[11px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            <span
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                applyToAll ? "bg-emerald-600" : dark ? "bg-slate-700" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  applyToAll ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </span>
            <span className="truncate">Use for all chats</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            tabIndex={open ? 0 : -1}
            className={`shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              dark
                ? "text-slate-300 hover:bg-slate-800 focus-visible:outline-slate-300"
                : "text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-600"
            }`}
          >
            Reset to default
          </button>
        </footer>
      </section>
    </div>
  );
}

export default memo(ChatThemePicker);