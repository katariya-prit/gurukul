import { LuSparkles } from "react-icons/lu";
import { useTheme } from "../../../components/theme/ThemeContext";

export default function DefaultLevelsButton({ onApply }: { onApply: () => void }) {
    const { theme } = useTheme();
    return (
        <button
            type="button"
            onClick={onApply}
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-2 sm:w-auto ${
                theme
                    ? "border-blue-500/30 text-blue-300 hover:bg-blue-500/10 focus-visible:outline-blue-300"
                    : "border-red-300 text-red-700 hover:bg-red-50 focus-visible:outline-red-500"
            }`}
        >
            <LuSparkles aria-hidden="true" />
            <span>Apply default levels</span>
        </button>
    );
}
