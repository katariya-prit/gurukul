import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../components/theme/ThemeContext";
import { quoteService, type QuoteData } from "../../services/Quoteservice";

interface EventItem {
    id: number;
    date: string;
    title: string;
    description: string;
    thumbnail: string;
    eventStartDate: string;
    eventEndDate: string;
    status: "Active" | "Inactive";
}

type EventQuote = Omit<Partial<QuoteData>, "id"> & {
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
    is_approved?: string | null;
    status?: string | null;
    event_date?: string | null;
    event_start_date?: string | null;
    event_end_date?: string | null;
    display_start_date?: string | null;
    display_end_date?: string | null;
};

type EventApiResponse = {
    success?: boolean;
    data?: unknown;
};

function getDateOnly(value?: string | null): string {
    return value ? value.split("T")[0].trim() : "";
}

function getTodayDate(): string {
    const today = new Date();

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");
}

function getEventStartDate(event: EventQuote): string {
    return getDateOnly(
        event.displayStartDate ||
        event.display_start_date ||
        event.eventStartDate ||
        event.event_start_date ||
        event.eventDate ||
        event.event_date
    );
}

function getEventEndDate(event: EventQuote): string {
    return getDateOnly(
        event.displayEndDate ||
        event.display_end_date ||
        event.eventEndDate ||
        event.event_end_date ||
        event.eventDate ||
        event.event_date
    );
}

function isEventVisibleToday(event: EventQuote): boolean {
    const approval = (
        event.isApproved ||
        event.is_approved ||
        ""
    ).toLowerCase();

    const status = (event.status || "Active").toLowerCase();

    if (approval !== "approved" || status !== "active") {
        return false;
    }

    const startDate = getEventStartDate(event);
    const endDate = getEventEndDate(event);
    const today = getTodayDate();

    if (!startDate || !endDate) {
        return true;
    }

    return startDate <= endDate && startDate <= today && today <= endDate;
}

function formatEventDate(value: string): string {
    if (!value) return "Date not available";

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).toUpperCase();
}

function mapQuoteToEventItem(event: EventQuote): EventItem {
    const startDate = getEventStartDate(event);
    const endDate = getEventEndDate(event);

    return {
        id: event.id,
        date: formatEventDate(startDate),
        title:
            event.name?.trim() ||
            event.title?.trim() ||
            "Upcoming Event",
        description:
            event.description?.trim() ||
            "No description provided.",
        thumbnail: event.imageUrl || event.image_url || "",
        eventStartDate: formatEventDate(startDate),
        eventEndDate: formatEventDate(endDate),
        status: "Active",
    };
}

function extractEventData(result: unknown): EventQuote[] {
    if (Array.isArray(result)) {
        return result as EventQuote[];
    }

    if (!result || typeof result !== "object") {
        return [];
    }

    const response = result as EventApiResponse;
    const data = response.data;

    if (Array.isArray(data)) {
        return data as EventQuote[];
    }

    if (data && typeof data === "object" && "data" in data) {
        const nestedData = (data as { data?: unknown }).data;

        if (Array.isArray(nestedData)) {
            return nestedData as EventQuote[];
        }
    }

    return [];
}

export default function UpcomingEventsPage() {
    const { theme } = useTheme();
    const [applyEvent, setApplyEvent] = useState<EventItem | null>(null);
    const [role, setRole] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [phone, setPhone] = useState("");
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchEvents = async () => {
            setLoading(true);

            try {
                const result = await quoteService.getQuotesByType("event");

                if (cancelled) return;

                const rawData = extractEventData(result);

                const visibleEvents = rawData
                    .filter(isEventVisibleToday)
                    .sort((a, b) => b.id - a.id)
                    .map(mapQuoteToEventItem);

                console.log("Events API response:", result);
                console.log("Events received:", rawData);
                console.log("Events displayed:", visibleEvents);

                setEvents(visibleEvents);
            } catch (error) {
                if (!cancelled) {
                    console.error("Error fetching events:", error);
                    setEvents([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void fetchEvents();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setIsMounted(true);
        }, 100);

        return () => window.clearTimeout(timer);
    }, []);

    const handleCloseModal = () => {
        setApplyEvent(null);
        setRole("");
        setPhone("");
    };

    const handleApplySubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        alert(`Successfully applied for: ${applyEvent?.title}`);
        handleCloseModal();
    };

    return (
        <div className={`scrollbar-none h-screen overflow-y-auto p-4 sm:p-8 scroll-smooth transition-colors duration-300 ${theme ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
            <div className="w-full px-2 sm:px-6 pb-20">
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-700/20 transition-all duration-1000 ease-out transform ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"}`}>
                    <div>
                        <Link
                            to="/"
                            className={`group inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full font-bold text-sm backdrop-blur-md border shadow-sm transition-all duration-300 ease-out active:scale-95 ${theme
                                ? "bg-[#151D2F]/80 text-slate-300 border-slate-700 hover:text-blue-400 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
                                : "bg-white/80 text-slate-700 border-slate-200 hover:text-red-600 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/15"
                                }`}
                        >
                            <svg className="w-4 h-4 transform transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </Link>

                        <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-6 tracking-tight bg-clip-text text-transparent pb-1 transition-all duration-500 ${theme
                            ? "bg-linear-to-r from-white via-slate-200 to-slate-500 drop-shadow-[0_2px_15px_rgba(255,255,255,0.08)]"
                            : "bg-linear-to-r from-slate-900 via-slate-700 to-slate-400"
                            }`}>
                            All Upcoming Events & Details
                        </h1>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${theme ? "border-blue-500" : "border-red-600"}`} />
                    </div>
                ) : events.length === 0 ? (
                    <p className={`text-center py-20 text-sm ${theme ? "text-slate-500" : "text-slate-400"}`}>
                        No upcoming events added yet.
                    </p>
                ) : (
                    <div className="space-y-6 w-full">
                        {events.map((item, index) => (
                            <div
                                key={item.id}
                                style={{ transitionDelay: `${index * 150}ms` }}
                                className={`transition-all duration-1000 ease-out transform ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}
                            >
                                <div
                                    id={`event-${item.id}`}
                                    className={`flex flex-col md:flex-row rounded-2xl border transition-all duration-300 hover:shadow-2xl overflow-hidden ${theme
                                        ? "bg-slate-900/80 border-slate-800 shadow-slate-950/50"
                                        : "bg-white border-slate-200 shadow-sm hover:shadow-xl"
                                        }`}
                                >
                                    <div className="flex flex-col md:flex-row gap-6 p-6 w-full md:w-[80%]">
                                        <div className="relative overflow-hidden rounded-xl w-full md:w-80 h-56 shrink-0">
                                            {item.thumbnail ? (
                                                <img
                                                    src={item.thumbnail}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover rounded-xl transition-transform duration-700 hover:scale-105"
                                                />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center rounded-xl ${theme ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                                                    No image available
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${theme ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-red-200 bg-red-50 text-red-600"}`}>
                                                    {item.eventStartDate} - {item.eventEndDate}
                                                </span>
                                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${theme ? "border-slate-700 bg-slate-800/80 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700"}`}>
                                                    {item.date}
                                                </span>
                                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${theme ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                                                    {item.status}
                                                </span>
                                            </div>

                                            <h2 className={`text-2xl font-bold mt-3 ${theme ? "text-white" : "text-slate-900"}`}>
                                                {item.title}
                                            </h2>

                                            <p className={`text-sm mt-3 leading-relaxed ${theme ? "text-slate-400" : "text-slate-600"}`}>
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`w-full md:w-[20%] p-5 flex flex-col items-center justify-center border-t md:border-t-0 ${theme ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white/80"}`}>
                                        <button
                                            onClick={() => {
                                                setApplyEvent(item);
                                                setRole("");
                                            }}
                                            className={`w-full px-4 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 ${theme
                                                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20"
                                                : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                                                }`}
                                        >
                                            Apply And Join Event
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {applyEvent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
                    onClick={handleCloseModal}
                >
                    <div
                        className={`relative w-full md:w-[70%] max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 sm:p-10 transition-all transform animate-in zoom-in-95 duration-300 ${theme
                            ? "bg-slate-900 border-slate-700 text-slate-100"
                            : "bg-white border-slate-200 text-slate-900"
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleCloseModal}
                            className={`absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm cursor-pointer hover:scale-110 active:scale-95 ${theme
                                ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                                }`}
                            aria-label="Close modal"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-8 border-b pb-6 border-slate-500/20">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 border ${theme ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-red-50 text-red-600 border-red-200"}`}>
                                Event Registration
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black mb-2">{applyEvent.title}</h2>
                            <p className="text-sm opacity-70 font-medium">{applyEvent.date}</p>
                        </div>

                        <form onSubmit={handleApplySubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 opacity-80">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter your full name"
                                        className={`w-full p-3 rounded-xl border outline-none transition-all ${theme
                                            ? "bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            : "bg-slate-50 border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 opacity-80">
                                        Participate As <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className={`w-full p-3 rounded-xl border outline-none transition-all ${theme
                                            ? "bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            : "bg-slate-50 border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            }`}
                                    >
                                        <option value="" disabled>Select your role...</option>
                                        <option value="student" className="text-black">Student</option>
                                        <option value="volunteer" className="text-black">Volunteer</option>
                                        <option value="participant" className="text-black">Participant / Devotee</option>
                                    </select>
                                </div>

                                {role === "student" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 opacity-80">
                                                Std / Class <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 10th, 12th, etc."
                                                className={`w-full p-3 rounded-xl border outline-none transition-all ${theme
                                                    ? "bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    : "bg-slate-50 border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2 opacity-80">
                                                SUID <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Enter Student Unique ID"
                                                className={`w-full p-3 rounded-xl border outline-none transition-all ${theme
                                                    ? "bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    : "bg-slate-50 border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                    }`}
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold mb-2 opacity-80">
                                        Phone Number {role === "student" ? (
                                            <span className="text-xs opacity-60 font-normal">(Optional)</span>
                                        ) : (
                                            <span className="text-red-500">*</span>
                                        )}
                                    </label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        required={role !== "student"}
                                        value={phone}
                                        placeholder="Enter your phone number"
                                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                                        className={`w-full p-3 rounded-xl border outline-none transition-all ${theme
                                            ? "bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            : "bg-slate-50 border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 opacity-80">
                                        Email Address {role === "student" ? (
                                            <span className="text-xs opacity-60 font-normal">(Optional)</span>
                                        ) : (
                                            <span className="text-red-500">*</span>
                                        )}
                                    </label>
                                    <input
                                        type="email"
                                        required={role !== "student"}
                                        placeholder="Enter your email"
                                        className={`w-full p-3 rounded-xl border outline-none transition-all ${theme
                                            ? "bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            : "bg-slate-50 border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            }`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 opacity-80">
                                    Additional Notes / Message
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Any specific information you'd like to share..."
                                    className={`w-full p-3 rounded-xl border outline-none transition-all resize-none ${theme
                                        ? "bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        : "bg-slate-50 border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        }`}
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8 pt-6 border-t border-slate-500/20">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className={`px-6 py-3 rounded-xl font-bold transition-all ${theme
                                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 ${theme
                                        ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30"
                                        : "bg-red-600 hover:bg-red-700 shadow-red-500/30"
                                        }`}
                                >
                                    Submit Registration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}