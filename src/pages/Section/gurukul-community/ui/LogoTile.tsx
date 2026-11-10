import gurukulLogo from "../../../../assets/gurukul.png";

export function LogoTile({ dark, size = 40, dot = false }: { dark: boolean; size?: number; dot?: boolean }) {
    return (
        <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
            <span
                className={`w-full h-full rounded-2xl flex items-center justify-center border transition-transform duration-300 hover:scale-105
                ${dark
                        ? "bg-linear-to-br from-slate-900 to-slate-950 border-slate-700 shadow-[0_8px_25px_rgba(0,0,0,0.6)]"
                        : "bg-linear-to-br from-white to-red-50/50 border-red-200/80 shadow-[0_8px_25px_rgba(220,38,38,0.15)]"
                    }`}
            >
                <img
                    src={gurukulLogo}
                    alt="Gurukul"
                    className="object-contain drop-shadow-sm"
                    style={{ width: size * 0.64, height: size * 0.64 }}
                />
            </span>
            {dot && (
                <span
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 ${
                        dark ? "border-[#0B1120]" : "border-white"
                    } shadow-sm`}
                />
            )}
        </span>
    );
}
