import React from "react";

export function SettingRow({
    dark,
    icon,
    title,
    subtitle,
    trailing,
    onClick,
    tone = "default",
    switchOn,
    disabled = false,
}: {
    dark: boolean;
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    trailing?: React.ReactNode;
    onClick?: () => void;
    tone?: "default" | "danger";
    switchOn?: boolean;
    disabled?: boolean;
}) {
    const titleColor = tone === "danger" ? (dark ? "text-rose-400" : "text-red-600") : dark ? "text-slate-100" : "text-slate-800";
    const iconColor = tone === "danger" ? (dark ? "text-rose-400" : "text-red-500") : dark ? "text-slate-400" : "text-slate-500";
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            role={switchOn !== undefined ? "switch" : undefined}
            aria-checked={switchOn}
            className={`flex w-full items-center gap-5 rounded-xl px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                dark ? "enabled:hover:bg-slate-800/70" : "enabled:hover:bg-slate-50"
            }`}
        >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-[22px] ${iconColor}`}>{icon}</span>
            <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${titleColor}`}>{title}</span>
                {subtitle && (
                    <span className={`mt-0.5 block text-xs leading-snug ${dark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</span>
                )}
            </span>
            {trailing}
        </button>
    );
}
