import { getInitials } from "../utils/formatters";

export function GroupAvatar({ dark, name, size = 40 }: { dark: boolean; name: string; size?: number }) {
    return (
        <span
            style={{ width: size, height: size, fontSize: size * 0.34 }}
            className={`shrink-0 rounded-full flex items-center justify-center font-bold tracking-wide text-white shadow-lg
            ${dark
                ? "bg-linear-to-br from-blue-600 via-indigo-600 to-sky-700 shadow-blue-950/50 border border-blue-400/30"
                : "bg-linear-to-br from-red-600 via-rose-600 to-orange-600 shadow-red-950/30 border border-red-400/30"
            }`}
        >
            {getInitials(name)}
        </span>
    );
}
