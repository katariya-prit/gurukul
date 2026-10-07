import { useEffect, useState } from "react";
import { useTheme } from "../components/theme/ThemeContext";
import SparklineStatCard, { type SparklinePoint } from "../components/dashboard/SparklineStatCard";
import PerformanceChart, { type ChartPoint } from "../components/dashboard/Performancechart";
import ActivityLogList, { type ActivityLogItem } from "../components/dashboard/Activityloglist";
import RoleDistribution, { type RoleDistributionItem } from "../components/dashboard/Roledistribution";
import LevelBadge from "../components/dashboard/Levelbadge";
import { HiOutlineOfficeBuilding, HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineAcademicCap } from "react-icons/hi";
import type { AuthUser } from "../Types/Role-create";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

interface DashboardStatsResponse {
    cards: { label: string; value: number; subLabel: string; trend?: SparklinePoint[] }[];
    chart: ChartPoint[];
    logs?: ActivityLogItem[];
    roleDistribution?: RoleDistributionItem[];
}

export default function Dashboard() {
    const { theme } = useTheme();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [range, setRange] = useState<"week" | "month">("month");
    const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const data = localStorage.getItem("user");
        if (data) setUser(JSON.parse(data));
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                setLoading(true);

                const params = new URLSearchParams({
                    role: user.roleCode,
                    range,
                });
                if ((user as any).departmentId) params.set("departmentId", String((user as any).departmentId));
                if ((user as any).sectionId) params.set("sectionId", String((user as any).sectionId));
                if (user.suid) params.set("suid", String(user.suid));

                const token = localStorage.getItem("token"); // 👈 ઉમેરવાનું

                const res = await fetch(`${API_URL}/dashboard/stats?${params.toString()}`, {
                    cache: "no-store",
                    headers: {
                        Authorization: `Bearer ${token}`, // 👈 ઉમેરવાનું
                    },
                });
                const json = await res.json();

                if (json.success) {
                    setStats(json.data);
                }
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, range]);

    const cardIcons = [
        <HiOutlineOfficeBuilding size={18} />,
        <HiOutlineUserGroup size={18} />,
        <HiOutlineShieldCheck size={18} />,
        <HiOutlineAcademicCap size={18} />,
    ];
    const cardColors: ("red" | "blue" | "green" | "purple" | "amber")[] = ["red", "blue", "green", "purple"];

    const isSuperAdmin = user?.roleCode === "SUPER_ADMIN";
    const isStudent = user?.roleCode === "STUDENT";

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-black ${theme ? "text-white" : "text-gray-900"}`}>
                        Welcome back, <span className={theme ? "text-blue-400" : "text-[#9b001c]"}>{user?.roleCode?.toLowerCase()}</span>
                    </h1>
                    <p className={`text-sm mt-1 ${theme ? "text-gray-500" : "text-gray-400"}`}>
                        Here is what's happening with your Gurukul management today.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {isStudent && <LevelBadge level={1} />}
                    <div className={`flex rounded-xl border p-1 ${theme ? "border-gray-700 bg-gray-800/60" : "border-gray-200 bg-gray-50"}`}>
                        {(["week", "month"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${range === r
                                        ? theme
                                            ? "bg-gray-700 text-white"
                                            : "bg-white text-gray-900 shadow-sm"
                                        : theme
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                            >
                                {r === "week" ? "1 Week" : "1 Month"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`grid gap-5 grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? "lg:grid-cols-4" : "lg:grid-cols-2"}`}>
                {(stats?.cards || []).map((card, i) => (
                    <SparklineStatCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        subLabel={card.subLabel}
                        data={card.trend}
                        icon={cardIcons[i % cardIcons.length]}
                        colorScheme={cardColors[i % cardColors.length]}
                        loading={loading}
                        index={i}
                        animationKey={range}
                    />
                ))}
            </div>

            <div className={`grid gap-5 grid-cols-1 ${isSuperAdmin ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}>
                <div className={isSuperAdmin ? "lg:col-span-2" : ""}>
                    <PerformanceChart
                        title={isStudent ? "My Progress" : "Growth Trend"}
                        subtitle={range === "week" ? "Last 7 days" : "Last 30 days"}
                        data={stats?.chart || []}
                        loading={loading}
                    />
                </div>
                {isSuperAdmin && (
                    <div className="space-y-5">
                        <RoleDistribution roles={stats?.roleDistribution || []} loading={loading} />
                        <ActivityLogList logs={stats?.logs || []} loading={loading} />
                    </div>
                )}
            </div>
        </div>
    );
}