import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiMenu, HiX } from "react-icons/hi";
import ThemeToggle from "../../components/theme/ThemeToggle";
import { useTheme } from "../../components/theme/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../services/OverviewService";
import VideoShowcaseCard from "./core/VideoShowcaseCard";
import { quoteService, type QuoteData } from "../../services/Quoteservice";

function Reveal({
    children,
    delay = 0,
    className = "",
    yOffset = 35,
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
    yOffset?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: yOffset, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
                duration: 0.7,
                delay,
                ease: [0.22, 1, 0.36, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// 🎯 Backend QuoteData ne Activities card na shape ma convert karva mate interface
interface ActivityCard {
    id: number;
    title: string;
    description?: string;
    date: string;
    image: string;
    imageCount?: number;
}

const GROUP_PREFIX = "__GURUKUL_ACTIVITY_GROUP_V1__";

interface ActivityGroupData {
    groupId?: string;
    title?: string;
    description?: string;
    coverImage?: string;
    cover_image?: string;
    coverUrl?: string;
    image?: string;
}

function parseActivityGroupData(rawText: string): ActivityGroupData | null {
    if (!rawText || !rawText.startsWith(GROUP_PREFIX)) return null;

    try {
        return JSON.parse(
            rawText.slice(GROUP_PREFIX.length)
        ) as ActivityGroupData;
    } catch {
        return null;
    }
}

interface EventCard {
    id: number;
    title: string;
    eventStartDate: string;
    eventEndDate: string;
    status: "Active" | "Inactive";
    description: string;
    thumbnail: string;
    displayStartDate: string;
    displayEndDate: string;
}

interface DarshanCard {
    id: number;
    title: string;
    date: string;
    image: string;
}

interface DarshanDTO {
    id: number;
    title: string;
    imageUrl: string;
    description: string;
    date: string;
}

interface HeroSlide {
    url: string;
    title: string;
    description: string;
}

function getDateOnly(value: string | null | undefined): string {
    if (!value) return "";

    const match = value.match(/^\d{4}-\d{2}-\d{2}/);

    if (match) return match[0];

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}


interface EventApiData {
    id: number;
    name?: string | null;
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    eventDate?: string | null;
    eventStartDate?: string | null;
    eventEndDate?: string | null;
    displayStartDate?: string | null;
    displayEndDate?: string | null;
    isApproved?: string | null;
    addToHero?: string | null;
    status?: string | null;
    type?: string | null;
}

interface EventCard {
    id: number;
    title: string;
    eventStartDate: string;
    eventEndDate: string;
    status: "Active" | "Inactive";
    description: string;
    thumbnail: string;
    displayStartDate: string;
    displayEndDate: string;
}

function isEventVisibleToday(event: EventApiData): boolean {
    const approval = String(event.isApproved ?? "")
        .trim()
        .toLowerCase();

    if (approval !== "approved") {
        return false;
    }

    if (
        event.status &&
        event.status.trim().toLowerCase() !== "active"
    ) {
        return false;
    }

    return true;
}

function mapQuoteToEventCard(event: EventApiData): EventCard {
    const startDate =
        event.eventStartDate ||
        event.eventDate ||
        "";

    const endDate =
        event.eventEndDate ||
        event.eventDate ||
        startDate;

    return {
        id: event.id,
        title:
            event.name?.trim() ||
            event.title?.trim() ||
            "Upcoming Event",
        eventStartDate: startDate,
        eventEndDate: endDate,
        status:
            event.status?.toLowerCase() === "inactive"
                ? "Inactive"
                : "Active",
        description: event.description?.trim() || "",
        thumbnail: event.imageUrl || event.image_url || "",
        displayStartDate:
            event.displayStartDate || startDate,
        displayEndDate:
            event.displayEndDate || endDate,
    };
}

function mapDarshanToCard(d: DarshanDTO): DarshanCard {
    const date = getDateOnly(d.date);
    const dateObj = date ? new Date(`${date}T00:00:00`) : null;

    return {
        id: d.id,
        title: d.title || "Daily Darshan",
        date:
            dateObj && !Number.isNaN(dateObj.getTime())
                ? dateObj.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }).toUpperCase()
                : "DATE NOT SET",
        image: d.imageUrl || "",
    };
}

const LATEST_QUOTES = [
    {
        id: 1,
        title: "Love and compassion are the true essence of spirituality.",
        date: "19 AUG 2026",
        image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&q=80&w=500"
    },
    {
        id: 2,
        title: "Service to parents is the true worship of God.",
        date: "18 AUG 2026",
        image: "https://images.unsplash.com/photo-1544200502-6652e105f865?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        id: 3,
        title: "Satsang from the heart brings peace in thoughts.",
        date: "17 AUG 2026",
        image: "https://images.unsplash.com/photo-1786748012490-1fdddb1b52dd?q=80&w=1213&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
];

export default function Overview() {
    const { theme } = useTheme();
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [overviewImages] = useState<HeroSlide[]>([
        { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1600", title: "", description: "" },
        { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1600", title: "", description: "" },
        { url: "https://images.unsplash.com/photo-1616080409883-a96ae084a7e1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", title: "", description: "" }
    ]);
    const [heroEventSlides, setHeroEventSlides] = useState<HeroSlide[]>([]);

    const [activities, setActivities] = useState<ActivityCard[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true);

    const [events, setEvents] = useState<EventCard[]>([]);
    const [eventsLoading, setEventsLoading] = useState<boolean>(true);

    const [darshanItems, setDarshanItems] = useState<DarshanCard[]>([]);
    const [darshanLoading, setDarshanLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setActivitiesLoading(true);
                const result = await quoteService.getQuotesByType("activity");
                if (result.success && Array.isArray(result.data)) {
                    const rawData: QuoteData[] = result.data;
                    const grouped = new Map<string, ActivityCard>();
                    const standalone: ActivityCard[] = [];

                    rawData.forEach((q) => {
                        const record = q as unknown as {
                            event_date?: string;
                            eventDate?: string;
                            image_url?: string;
                            imageUrl?: string;
                        };
                        const imageUrl = record.image_url ?? record.imageUrl ?? "";
                        const dateObj = new Date(record.event_date ?? record.eventDate ?? "");
                        const formattedDate = dateObj
                            .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                            .toUpperCase();

                        const parsed = parseActivityGroupData(q.description || "");

                        if (parsed && parsed.groupId) {
                            const groupCoverImage =
                                parsed.coverImage || parsed.cover_image || parsed.coverUrl || parsed.image || imageUrl;
                            if (!grouped.has(parsed.groupId)) {
                                grouped.set(parsed.groupId, {
                                    id: q.id,
                                    title: parsed.title || "Gurukul Activity",
                                    description: parsed.description || "",
                                    date: formattedDate,
                                    image: groupCoverImage,
                                    imageCount: 1,
                                });
                            } else {
                                const existing = grouped.get(parsed.groupId)!;
                                existing.imageCount = (existing.imageCount || 1) + 1;

                                const coverImage = parsed.coverImage || parsed.cover_image || parsed.coverUrl;

                                if (coverImage) {
                                    existing.image = coverImage;
                                }
                            }
                        } else {
                            standalone.push({
                                id: q.id,
                                title: q.description?.trim() || "Gurukul Activity",
                                description: "",
                                date: formattedDate,
                                image: imageUrl,
                                imageCount: 1,
                            });
                        }
                    });

                    const uniqueActivities = [...Array.from(grouped.values()), ...standalone];
                    setActivities(
                        [...uniqueActivities]
                            .sort((a, b) => b.id - a.id)
                            .slice(0, 4)
                    );
                }
            } catch (error) {
                console.error("Error fetching activities:", error);
            } finally {
                setActivitiesLoading(false);
            }
        };
        fetchActivities();
    }, []);

    // 🎯 Activities Fetch and Group Logic (Cover image resolution updated)
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setActivitiesLoading(true);
                const result = await quoteService.getQuotesByType("activity");
                if (result.success && Array.isArray(result.data)) {
                    const rawData: QuoteData[] = result.data;
                    const grouped = new Map<string, ActivityCard>();
                    const standalone: ActivityCard[] = [];

                    rawData.forEach((q) => {
                        const parsed = parseActivityGroupData(q.description || "");
                        const dateObj = new Date(q.event_date);
                        const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

                        if (parsed && parsed.groupId) {
                            const groupCoverImage = parsed.coverImage || parsed.cover_image || parsed.coverUrl || parsed.image || q.image_url;
                            if (!grouped.has(parsed.groupId)) {
                                grouped.set(parsed.groupId, {
                                    id: q.id,
                                    title: parsed.title || "Gurukul Activity",
                                    description: parsed.description || "",
                                    date: formattedDate,
                                    image: groupCoverImage,
                                    imageCount: 1
                                });
                            } else {
                                const existing = grouped.get(parsed.groupId)!;
                                existing.imageCount = (existing.imageCount || 1) + 1;

                                const coverImage = parsed.coverImage || parsed.cover_image || parsed.coverUrl;

                                if (coverImage) {
                                    existing.image = coverImage;
                                }
                            }
                        } else {
                            standalone.push({
                                id: q.id,
                                title: q.description?.trim() || "Gurukul Activity",
                                description: "",
                                date: formattedDate,
                                image: q.image_url,
                                imageCount: 1
                            });
                        }
                    });

                    // Combine unique grouped activities and standalone activities
                    const uniqueActivities = [...Array.from(grouped.values()), ...standalone];
                    setActivities(
                        [...uniqueActivities]
                            .sort((a, b) => b.id - a.id)
                            .slice(0, 4)
                    );
                }
            } catch (error) {
                console.error("Error fetching activities:", error);
            } finally {
                setActivitiesLoading(false);
            }
        };
        fetchActivities();
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchEvents = async () => {
            setEventsLoading(true);

            try {
                const result = await quoteService.getQuotesByType("event");

                if (cancelled) return;

                const rawData = (
                    result as unknown as { data?: EventApiData[] }
                ).data;

                if (!Array.isArray(rawData)) {
                    console.error("Invalid events response:", result);
                    setEvents([]);
                    setHeroEventSlides([]);
                    return;
                }

                console.log("Events received:", rawData);

                const visibleEvents = rawData
                    .filter(isEventVisibleToday)
                    .sort((a, b) => b.id - a.id);

                console.log("Events displayed:", visibleEvents);

                setEvents(
                    visibleEvents.map(mapQuoteToEventCard).slice(0, 4)
                );

                setHeroEventSlides(
                    visibleEvents
                        .filter(
                            event =>
                                event.addToHero?.trim().toLowerCase() === "yes" &&
                                Boolean(event.imageUrl || event.image_url)
                        )
                        .map(event => ({
                            url: event.imageUrl || event.image_url || "",
                            title:
                                event.name?.trim() ||
                                event.title?.trim() ||
                                "Upcoming Event",
                            description: event.description?.trim() || "",
                        }))
                );
            } catch (error) {
                console.error("Error fetching events:", error);

                if (!cancelled) {
                    setEvents([]);
                    setHeroEventSlides([]);
                }
            } finally {
                if (!cancelled) {
                    setEventsLoading(false);
                }
            }
        };

        fetchEvents();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const fetchDarshan = async () => {
            try {
                setDarshanLoading(true);
                const res = await fetch(`${API_BASE_URL}/daily-darshan`, { cache: "no-store" });
                const result = await res.json();
                if (result.success) {
                    setDarshanItems(
                        (result.data as DarshanDTO[])
                            .map(mapDarshanToCard)
                            .slice(0, 3)
                    );
                }
            } catch (error) {
                console.error("Error fetching daily darshan:", error);
            } finally {
                setDarshanLoading(false);
            }
        };
        fetchDarshan();
    }, []);

    useEffect(() => {
        const totalSlides = overviewImages.length + heroEventSlides.length;

        if (totalSlides <= 1) {
            setCurrentImgIndex(0);
            return;
        }

        setCurrentImgIndex((current) => current % totalSlides);

        const timer = window.setInterval(() => {
            setCurrentImgIndex((current) => (current + 1) % totalSlides);
        }, 4000);

        return () => window.clearInterval(timer);
    }, [overviewImages.length, heroEventSlides.length]);

    const heroImages: HeroSlide[] = [
        ...overviewImages,
        ...heroEventSlides,
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
        setMobileMenuOpen(false);
    };

    const navItems = [
        { name: "Activities", id: "section-activities" },
        { name: "Events", id: "section-events" },
        { name: "Daily Quotes", id: "section-quotes" },
        { name: "Daily Darshan", id: "section-darshan" },
    ];

    const heroHighlights = [
        {
            title: "Where wisdom awakens the soul.",
            description: "A timeless journey of knowledge, discipline, and devotion — shaping values that shine far beyond the classroom.",
        },
        {
            title: "Nurturing character with purpose.",
            description: "Every moment at Gurukul blends tradition, mentorship, and resilience to build confident, compassionate leaders.",
        },
        {
            title: "Celebrating culture, faith, and growth.",
            description: "From satsang to service, our community embraces vibrant learning that keeps heritage alive in every heart.",
        },
    ];

    const activeHeroSlide = heroImages[currentImgIndex] || {
        url: "",
        ...heroHighlights[currentImgIndex % heroHighlights.length],
    };

    const navigate = useNavigate()

    return (
        <div className={`w-full h-screen overflow-y-auto overflow-x-hidden font-sans transition-colors duration-500 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none ${theme ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>

            {/* ---------------- TRANSPARENT HEADER ---------------- */}
            <header className="absolute top-0 left-0 z-50 w-full bg-transparent pt-6 pb-4">
                <div className="w-full px-4 sm:px-8 lg:px-12 flex items-center justify-between relative">
                    <div className="flex items-center gap-6 sm:gap-10 shrink-0 z-10">
                        <div className="shrink-0">
                            <ThemeToggle />
                        </div>
                        <Link to="/" className="text-2xl font-black tracking-tight flex items-center gap-2 shrink-0 group">
                            <span className={`w-3.5 h-3.5 rounded-full transition-all duration-300 group-hover:scale-125 ${theme ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"}`} />
                            <span className="text-white drop-shadow-md">Gurukul</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 shrink-0 z-10">
                        <nav className="hidden lg:flex items-center gap-3">
                            {navItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide backdrop-blur-md border shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer ${theme
                                        ? "bg-slate-900/60 border-slate-700/60 text-slate-100 hover:bg-slate-800/90 hover:border-blue-500/60 hover:shadow-blue-500/20"
                                        : "bg-white/50 border-white/70 text-slate-900 hover:bg-white/80 hover:border-red-500/50 hover:shadow-red-500/20"
                                        }`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </nav>

                        <button
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            aria-label="Toggle navigation menu"
                            className={`lg:hidden flex items-center justify-center w-11 h-11 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${theme
                                ? "bg-slate-900/60 border-slate-700/60 text-white hover:bg-slate-800/90"
                                : "bg-white/50 border-white/70 text-slate-900 hover:bg-white/80"
                                }`}
                        >
                            {mobileMenuOpen ? <HiX size={20} /> : <HiMenu size={20} />}
                        </button>

                        {/* 🎯 iOS Morphing Button -> layoutId ઉમેરવામાં આવ્યો છે */}
                        <motion.div
                            layoutId="login-card-transform"
                            onClick={() => navigate("/login")}
                            className={`px-7 py-2.5 rounded-xl font-bold text-sm shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 border cursor-pointer flex items-center justify-center ${theme
                                ? "bg-blue-600/90 border-blue-400/50 text-white hover:bg-blue-500 hover:shadow-blue-500/40"
                                : "bg-red-600/90 border-red-500/50 text-white hover:bg-red-500 hover:shadow-red-500/40"
                                }`}
                        >
                            Login
                        </motion.div>
                    </div>
                </div>

                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="lg:hidden w-full px-4 sm:px-8 mt-3"
                        >
                            <div
                                className={`flex flex-col gap-2 p-3 rounded-2xl backdrop-blur-md border shadow-xl ${theme
                                    ? "bg-slate-900/90 border-slate-700/60"
                                    : "bg-white/90 border-white/70"
                                    }`}
                            >
                                {navItems.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => scrollToSection(item.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer ${theme
                                            ? "text-slate-100 hover:bg-slate-800/90 hover:text-blue-300"
                                            : "text-slate-900 hover:bg-red-50 hover:text-red-600"
                                            }`}
                                    >
                                        {item.name}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ---------------- SECTION 1: HERO SLIDER ---------------- */}
            <section className="relative h-screen min-h-150 w-full flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute inset-0 z-0">
                    {heroImages.map((slide, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: index === currentImgIndex ? 1 : 0 }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                            className="absolute inset-0 bg-cover bg-center scale-105"
                            style={{ backgroundImage: `url(${slide.url})` }}
                        />
                    ))}
                    <div className={`absolute inset-0 transition-colors duration-500 ${theme ? "bg-slate-950/20" : "bg-white/20"}`} />
                    <div className={`absolute inset-0 ${theme ? "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_35%),linear-gradient(180deg,rgba(10,10,15,0),rgba(10,10,15,0.4))]" : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.28))]"}`} />
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 h-48 sm:h-56 lg:h-64 pointer-events-none flex flex-col justify-end">

                    <div className={`absolute inset-0 bg-linear-to-t ${theme ? "from-slate-950 via-slate-950/80 to-transparent" : "from-slate-50 via-slate-50/80 to-transparent"}`} />

                    <div className="relative mx-auto flex w-full max-w-full items-end px-4 pb-6 sm:px-8 lg:px-12 z-20">
                        <div className="relative w-full overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeHeroSlide.title}
                                    initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
                                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                                    className="space-y-2"
                                >
                                    <h2 className={`text-xl font-black tracking-tight drop-shadow-[0_8px_20px_rgba(0,0,0,0.18)] sm:text-2xl lg:text-4xl ${theme ? "text-white" : "text-slate-900"}`}>
                                        {activeHeroSlide.title}
                                    </h2>
                                    <p className={`w-full max-w-5xl text-xs leading-5 sm:text-sm lg:text-base font-medium drop-shadow-md ${theme ? "text-slate-200/90" : "text-slate-700/90"}`}>
                                        {activeHeroSlide.description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-28 left-0 right-0 z-20 flex justify-center gap-3">
                    {heroImages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentImgIndex(idx)}
                            className={`h-2.5 rounded-full transition-all duration-300 hover:scale-125 ${idx === currentImgIndex
                                ? (theme ? "w-10 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" : "w-10 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]")
                                : "w-2.5 bg-white/55 hover:bg-white"
                                }`}
                        />
                    ))}
                </div>
            </section>

            {/* ---------------- SECTION 2: ACTIVITIES ---------------- */}
            <section id="section-activities" className="w-full min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-32 scroll-mt-0">
                <Reveal>
                    <div className="flex items-center justify-between mb-12 border-b pb-4 border-slate-200/20 group">
                        <div>
                            <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${theme ? "text-blue-400 group-hover:text-blue-300" : "text-red-600 group-hover:text-red-500"}`}>
                                Gurukul Highlights
                            </span>
                            <h2 className="text-3xl font-black mt-1 tracking-tight">ACTIVITIES</h2>
                        </div>
                        <Link
                            to="/activities"
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border ${theme ? "bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30 hover:shadow-blue-900/30 hover:border-blue-500/60" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:shadow-red-200 hover:border-red-300"
                                }`}
                        >
                            VIEW ALL ACTIVITIES
                        </Link>
                    </div>
                </Reveal>

                {activitiesLoading ? (
                    <div className="flex justify-center py-16">
                        <div className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${theme ? "border-blue-500" : "border-red-600"}`} />
                    </div>
                ) : activities.length === 0 ? (
                    <p className={`text-center py-16 text-sm ${theme ? "text-slate-500" : "text-slate-400"}`}>
                        No activities added yet.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {activities.map((act, idx) => (
                            <Reveal key={act.id} delay={idx * 0.12} yOffset={45}>
                                <Link to="/activities" className="block cursor-pointer">
                                    <motion.div
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className={`group rounded-2xl overflow-hidden border shadow-xs transition-all duration-300 ${theme ? "bg-slate-900/60 border-slate-800 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-900/20" : "bg-white border-slate-200 hover:shadow-xl hover:border-red-200"
                                            }`}
                                    >
                                        <div className="h-64 overflow-hidden relative">
                                            <img
                                                src={act.image}
                                                alt={act.title}
                                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                            />
                                            <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs transition-transform duration-300 group-hover:scale-105 group-hover:bg-black/90">
                                                {act.date}
                                            </span>
                                            {/* Image count badge if it's a grouped activity */}
                                            {act.imageCount && act.imageCount > 1 && (
                                                <span className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md flex items-center gap-1 transition-transform duration-300 group-hover:scale-105">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {act.imageCount} Images
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <span className={`text-xs font-bold transition-colors duration-300 ${theme ? "text-blue-400 group-hover:text-blue-300" : "text-red-600 group-hover:text-red-500"}`}>
                                                Gurukul Highlights
                                            </span>
                                            <h3 className="font-bold text-lg mt-2 line-clamp-1 leading-snug">
                                                {act.title}
                                            </h3>
                                            {act.description && (
                                                <p className={`text-xs mt-1 line-clamp-2 ${theme ? "text-slate-400" : "text-slate-500"}`}>
                                                    {act.description}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                </Link>
                            </Reveal>
                        ))}
                    </div>
                )}
            </section>

            {/* ---------------- SECTION 3: UPCOMING EVENTS ---------------- */}
            <section id="section-events" className={`w-full min-h-screen flex flex-col justify-center py-32 scroll-mt-0 transition-colors duration-500 ${theme ? "bg-slate-900/40" : "bg-slate-100/60"}`}>
                <div className="w-full px-6 sm:px-12 lg:px-16">
                    <Reveal>
                        <div className="flex items-center justify-between mb-12 border-b pb-4 border-slate-200/20 group">
                            <div>
                                <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${theme ? "text-blue-400 group-hover:text-blue-300" : "text-red-600 group-hover:text-red-500"}`}>
                                    Satsang Schedule
                                </span>
                                <h2 className="text-3xl font-black mt-1 tracking-tight">UPCOMING EVENTS</h2>
                            </div>
                            <Link
                                to="/events"
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border ${theme ? "bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30 hover:shadow-blue-900/30 hover:border-blue-500/60" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:shadow-red-200 hover:border-red-300"
                                    }`}
                            >
                                VIEW ALL EVENTS
                            </Link>
                        </div>
                    </Reveal>

                    {eventsLoading ? (
                        <p>Loading events...</p>
                    ) : events.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {events.map(event => (
                                <article
                                    key={event.id}
                                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
                                >
                                    {event.thumbnail && (
                                        <img
                                            src={event.thumbnail}
                                            alt={event.title}
                                            className="h-48 w-full object-cover"
                                        />
                                    )}

                                    <div className="p-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {event.title}
                                        </h3>

                                        {event.description && (
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                                {event.description}
                                            </p>
                                        )}

                                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                            {event.displayStartDate}
                                            {event.displayEndDate &&
                                                event.displayEndDate !== event.displayStartDate
                                                ? ` - ${event.displayEndDate}`
                                                : ""}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">
                            No events available.
                        </p>
                    )}
                </div>
            </section>

            {/* ---------------- SECTION 4: DAILY QUOTES ---------------- */}
            <section id="section-quotes" className="w-full min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-32 scroll-mt-0">
                <Reveal>
                    <div className="flex items-center justify-between mb-12 border-b pb-4 border-slate-200/20 group">
                        <div>
                            <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${theme ? "text-blue-400 group-hover:text-blue-300" : "text-red-600 group-hover:text-red-500"}`}>
                                Daily Inspiration
                            </span>
                            <h2 className="text-3xl font-black mt-1 tracking-tight">DAILY QUOTES</h2>
                        </div>
                        <Link
                            to="/amrut-aachaman"
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border ${theme ? "bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30 hover:shadow-blue-900/30 hover:border-blue-500/60" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:shadow-red-200 hover:border-red-300"
                                }`}
                        >
                            VIEW MORE QUOTES
                        </Link>
                    </div>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {LATEST_QUOTES.map((q, idx) => (
                        <Reveal key={q.id} delay={idx * 0.1}>
                            <motion.div
                                whileHover={{ y: -8, scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                                className={`group rounded-2xl overflow-hidden border transition-all duration-300 ${theme ? "bg-slate-900/60 border-slate-800 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-900/20" : "bg-white border-slate-200 shadow-xs hover:shadow-xl hover:border-red-200"
                                    }`}
                            >
                                <div className="h-72 overflow-hidden relative">
                                    <img src={q.image} alt={q.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                                </div>
                                <div className="p-6">
                                    <span className={`text-xs font-medium transition-colors duration-300 ${theme ? "text-slate-400 group-hover:text-blue-400" : "text-slate-500 group-hover:text-red-500"}`}>{q.date}</span>
                                    <p className="font-bold text-xl mt-2 leading-snug">
                                        "{q.title}"
                                    </p>
                                </div>
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ---------------- SECTION 5: DAILY DARSHAN ---------------- */}
            <section id="section-darshan" className={`w-full min-h-screen flex flex-col justify-center py-32 scroll-mt-0 transition-colors duration-500 ${theme ? "bg-slate-900/30" : "bg-slate-100/50"}`}>
                <div className="w-full px-6 sm:px-12 lg:px-16">
                    <Reveal>
                        <div className="flex items-center justify-between mb-12 border-b pb-4 border-slate-200/20 group">
                            <div>
                                <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${theme ? "text-blue-400 group-hover:text-blue-300" : "text-red-600 group-hover:text-red-500"}`}>
                                    Nitya Darshan
                                </span>
                                <h2 className="text-3xl font-black mt-1 tracking-tight">DAILY DARSHAN</h2>
                            </div>
                            <Link
                                to="/daily-darshan"
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border ${theme ? "bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30 hover:shadow-blue-900/30 hover:border-blue-500/60" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:shadow-red-200 hover:border-red-300"
                                    }`}
                            >
                                VIEW MORE DARSHAN
                            </Link>
                        </div>
                    </Reveal>

                    {darshanLoading ? (
                        <div className="flex justify-center py-16">
                            <div className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${theme ? "border-blue-500" : "border-red-600"}`} />
                        </div>
                    ) : darshanItems.length === 0 ? (
                        <p className={`text-center py-16 text-sm ${theme ? "text-slate-500" : "text-slate-400"}`}>
                            No darshan added yet.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {darshanItems.map((d, idx) => (
                                <Reveal key={d.id} delay={idx * 0.1}>
                                    <motion.div
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        transition={{ duration: 0.3 }}
                                        className={`group rounded-2xl overflow-hidden border transition-all duration-300 ${theme ? "bg-slate-900/60 border-slate-800 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-900/20" : "bg-white border-slate-200 shadow-xs hover:shadow-xl hover:border-red-200"
                                            }`}
                                    >
                                        <div className="h-80 overflow-hidden relative">
                                            <img src={d.image} alt={d.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                                        </div>
                                        <div className="p-6">
                                            <span className={`text-xs font-medium transition-colors duration-300 ${theme ? "text-slate-400 group-hover:text-blue-400" : "text-slate-500 group-hover:text-red-500"}`}>{d.date}</span>
                                            <h3 className="font-bold text-lg mt-2 leading-snug">
                                                {d.title}
                                            </h3>
                                        </div>
                                    </motion.div>
                                </Reveal>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ---------------- SECTION 6: FOOTER ---------------- */}
            <footer className={`w-full pt-16 pb-12 border-t transition-colors duration-500 ${theme ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-900 border-slate-800 text-slate-200"}`}>
                <div className="w-full px-6 sm:px-12 lg:px-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-slate-800">
                        <Reveal>
                            <h3 className={`text-2xl font-black mb-3 transition-colors duration-300 ${theme ? "text-blue-400 hover:text-blue-300" : "text-red-500 hover:text-red-400"}`}>
                                Shree Swaminarayan Gurukul - Bhayavadar
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-400">
                                Padvala Road, Ta.Upleta, Dist. Rajkot, Bhayavadar (Gujarat)<br />
                                Establishing true education with moral values and divine devotion for societal welfare.
                            </p>
                        </Reveal>

                        <Reveal delay={0.1}>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Quick Navigation</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li><button onClick={() => scrollToSection("section-quotes")} className={`inline-block transition-all duration-300 hover:translate-x-2 cursor-pointer ${theme ? "hover:text-blue-400" : "hover:text-red-400"}`}>Daily Quotes</button></li>
                                <li><button onClick={() => scrollToSection("section-darshan")} className={`inline-block transition-all duration-300 hover:translate-x-2 cursor-pointer ${theme ? "hover:text-blue-400" : "hover:text-red-400"}`}>Daily Darshan</button></li>
                                <li><button onClick={() => scrollToSection("section-activities")} className={`inline-block transition-all duration-300 hover:translate-x-2 cursor-pointer ${theme ? "hover:text-blue-400" : "hover:text-red-400"}`}>Activities</button></li>
                                <li><button onClick={() => scrollToSection("section-events")} className={`inline-block transition-all duration-300 hover:translate-x-2 cursor-pointer ${theme ? "hover:text-blue-400" : "hover:text-red-400"}`}>Upcoming Events</button></li>
                            </ul>
                        </Reveal>

                        <Reveal delay={0.2}>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contact & Support</h4>
                            <div className="space-y-3 text-sm text-slate-400">
                                <p className="transition-colors duration-300 hover:text-white"><strong className={theme ? "text-blue-400" : "text-red-400"}>Phone:</strong> +91 70484 80003/4</p>
                                <p className="transition-colors duration-300 hover:text-white"><strong className={theme ? "text-blue-400" : "text-red-400"}>Email:</strong> BhayavarGurukul@gmail.com</p>
                                <p className="transition-colors duration-300 hover:text-white"><strong className={theme ? "text-blue-400" : "text-red-400"}>Support:</strong> support@RajkotSansthan.com</p>
                            </div>
                        </Reveal>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
                        <p>© {new Date().getFullYear()} Swaminarayan Gurukul Rajkot Sansthan. All Rights Reserved.</p>
                        <div className="flex gap-6">
                            <span className="hover:text-slate-300 transition-colors duration-300 cursor-pointer">Privacy Policy</span>
                            <span className="hover:text-slate-300 transition-colors duration-300 cursor-pointer">Terms of Service</span>
                        </div>
                    </div>
                </div>
            </footer>
            <VideoShowcaseCard
                videoUrl="https://youtu.be/dLi0_cwqPWk?si=umT3vhSHxNekWVmP"
                width={800}
                height={450}
            />
        </div>
    );
}