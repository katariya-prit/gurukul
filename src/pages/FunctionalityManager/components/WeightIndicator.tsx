import { useTheme } from "../../../components/theme/ThemeContext";

export default function WeightIndicator({ total }: { total: number }) {
    const { theme } = useTheme();
    const complete = total === 100;
    return (
        <p role="status" className={`rounded-xl px-3 py-2 text-sm font-bold ${
            complete
                ? theme ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                : theme ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700"
        }`}>
            Total weight: {total} / 100
        </p>
    );
}
