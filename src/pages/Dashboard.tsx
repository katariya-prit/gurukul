import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
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

function getStoredDashboardUser(): AuthUser | null {
    const data = localStorage.getItem("user");
    if (!data) return null;

    try {
        const parsedUser = JSON.parse(data) as AuthUser;
        if (typeof parsedUser.permissions === "string") {
            try {
                parsedUser.permissions = JSON.parse(parsedUser.permissions);
            } catch (error) {
                console.error("Failed to parse dashboard user permissions", error);
                parsedUser.permissions = {};
            }
        }
        return parsedUser;
    } catch (error) {
        console.error("Failed to parse dashboard user", error);
        return null;
    }
}

export default function Dashboard() {
    const { theme } = useTheme();
    const shouldReduceMotion = useReducedMotion();
    const [user] = useState<AuthUser | null>(getStoredDashboardUser);
    const [range, setRange] = useState<"week" | "month">("month");
    const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                setLoading(true);

                const params = new URLSearchParams({
                    role: user.roleCode,
                    range,
                });
                if (user.departmentId != null) params.set("departmentId", String(user.departmentId));
                if (user.sectionId != null) params.set("sectionId", String(user.sectionId));
                if (user.suid) params.set("suid", String(user.suid));

                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/dashboard/stats?${params.toString()}`, {
                    cache: "no-store",
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
    const userLabel = user?.username || user?.roleName || user?.roleCode?.toLowerCase() || "there";

    return (
        <div className={`dashboard-canvas space-y-7 ${theme ? "dashboard-canvas--dark" : "dashboard-canvas--light"}`}>
            <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
            >
                <div>
                    <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${theme ? "text-white" : "text-gray-900"}`}>
                        Welcome back, <span className={theme ? "text-blue-300" : "text-[#9b001c]"}>{userLabel}</span>
                    </h1>
                    <p className={`mt-1.5 text-sm ${theme ? "text-gray-400" : "text-gray-500"}`}>
                        {isStudent ? "A little progress each day adds up." : "Here is what is happening across your Gurukul."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {isStudent && <LevelBadge level={1} />}
                    <div className={`flex rounded-xl border p-1 ${theme ? "border-gray-700/80 bg-gray-800/70" : "border-gray-200 bg-white/80"}`}>
                        {(["week", "month"] as const).map((period) => (
                            <button
                                key={period}
                                type="button"
                                onClick={() => setRange(period)}
                                aria-pressed={range === period}
                                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors duration-200 ${
                                    range === period
                                        ? theme
                                            ? "bg-gray-700 text-white shadow-sm"
                                            : "bg-white text-gray-900 shadow-sm"
                                        : theme
                                            ? "text-gray-400 hover:text-gray-200"
                                            : "text-gray-500 hover:text-gray-800"
                                }`}
                            >
                                {period === "week" ? "1 Week" : "1 Month"}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isSuperAdmin ? "xl:grid-cols-4" : "xl:grid-cols-2"}`}>
                {(stats?.cards || []).map((card, index) => (
                    <SparklineStatCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        subLabel={card.subLabel}
                        data={card.trend}
                        icon={cardIcons[index % cardIcons.length]}
                        colorScheme={cardColors[index % cardColors.length]}
                        loading={loading}
                        index={index}
                        animationKey={range}
                    />
                ))}
            </div>

            <div className={`grid grid-cols-1 gap-5 ${isSuperAdmin ? "xl:grid-cols-3" : "xl:grid-cols-1"}`}>
                <div className={isSuperAdmin ? "xl:col-span-2" : ""}>
                    <PerformanceChart
                        title={isStudent ? "My learning progress" : "Learning activity"}
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
