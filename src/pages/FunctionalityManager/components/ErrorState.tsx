import { LuCircleAlert, LuRefreshCw } from "react-icons/lu";
import { useTheme } from "../../../components/theme/ThemeContext";

export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    const { theme } = useTheme();
    return (
        <div role="alert" className={`flex flex-col items-center justify-center rounded-2xl border px-5 py-10 text-center ${
            theme ? "border-red-400/20 bg-red-400/5 text-red-200" : "border-red-200 bg-red-50 text-red-800"
        }`}>
            <LuCircleAlert className="mb-3 text-3xl" aria-hidden="true" />
            <p className="font-semibold">Could not load this page</p>
            <p className="mt-1 max-w-xl text-sm opacity-80">{message}</p>
            <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-current px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
                <LuRefreshCw aria-hidden="true" />
                Retry
            </button>
        </div>
    );
}
