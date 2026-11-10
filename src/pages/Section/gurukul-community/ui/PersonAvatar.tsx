import { getInitials } from "../utils/formatters";

export function PersonAvatar({
    dark,
    name,
    avatar,
    size = 32,
    superBadge = false,
    online = false,
}: {
    dark: boolean;
    name: string;
    avatar?: string;
    size?: number;
    superBadge?: boolean;
    online?: boolean;
}) {
    return (
        <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
            <span
                style={{ fontSize: Math.max(9, size * 0.32) }}
                className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden font-bold shadow-md
                ${superBadge
                        ? dark
                            ? "bg-linear-to-br from-blue-600 to-indigo-700 text-white ring-2 ring-blue-400/60 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                            : "bg-linear-to-br from-red-600 to-rose-700 text-white ring-2 ring-red-400/60 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                        : dark
                            ? "bg-slate-800 text-blue-300 border border-slate-700"
                            : "bg-red-50 text-red-700 border border-red-200"
                    }`}
            >
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
            </span>
            {online && (
                <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 ${
                        dark ? "border-[#0B1120]" : "border-white"
                    }`}
                />
            )}
        </span>
    );
}
