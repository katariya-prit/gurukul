import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTheme } from "../theme/ThemeContext";

export interface ChartPoint {
    label: string; // e.g. "Mon", "Week 1", "Jan"
    value: number;
}

interface PerformanceChartProps {
    title: string;
    subtitle?: string;
    data: ChartPoint[];
    loading?: boolean;
}

export default function PerformanceChart({ title, subtitle, data, loading }: PerformanceChartProps) {
    const { theme } = useTheme();
    const strokeColor = theme ? "#60A5FA" : "#9b001c";
    const gridColor = theme ? "#1f2937" : "#f1f5f9";
    const textColor = theme ? "#6b7280" : "#9ca3af";

    return (
        <div
            className={`rounded-2xl border p-5 transition-colors ${
                theme ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
            }`}
        >
            <div className="mb-4">
                <h3 className={`text-sm font-bold ${theme ? "text-gray-200" : "text-gray-800"}`}>{title}</h3>
                {subtitle && <p className={`text-xs mt-0.5 ${theme ? "text-gray-500" : "text-gray-400"}`}>{subtitle}</p>}
            </div>

            {loading ? (
                <div className={`h-64 rounded-xl animate-pulse ${theme ? "bg-gray-800/60" : "bg-gray-100"}`} />
            ) : data.length === 0 ? (
                <div className={`h-64 flex items-center justify-center text-sm ${theme ? "text-gray-600" : "text-gray-400"}`}>
                    No data available yet
                </div>
            ) : (
                <ResponsiveContainer
                    width="100%"
                    height={260}
                    minWidth={0}
                    minHeight={260}
                    initialDimension={{ width: 320, height: 260 }}
                >
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme ? "#111827" : "#ffffff",
                                border: `1px solid ${theme ? "#1f2937" : "#f1f5f9"}`,
                                borderRadius: "10px",
                                fontSize: "12px",
                            }}
                        />
                        <Area type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2.5} fill="url(#perfGradient)" />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}