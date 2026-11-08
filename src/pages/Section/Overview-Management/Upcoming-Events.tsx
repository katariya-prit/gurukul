import React, { useState, useEffect, useRef, type DragEvent } from 'react';
import { Upload, Save, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../../components/theme/ThemeContext';
import PremiumDateField from '../../../components/Students/PremiumDateField';
import DatePicker from '../../../components/common/Calendar';
import ImageCropEditor from '../../../components/common/ImageCropEditor';
import { quoteService, type QuoteData } from '../../../services/Quoteservice';
import UserActionMenu from '../../../components/user-actions/UserActionMenu';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import { useConfirm } from '../../../components/overlay/useConfirm';
import { Modal } from '../../../components/overlay/OverlayPrimitives';

const DateField = PremiumDateField;

interface UpcomingEvent {
    id: number;
    image: string;
    description: string;
    date: string;
    name: string;
    displayStartDate: string;
    displayEndDate: string;
    eventStartDate: string;
    eventEndDate: string;
    isApproved: "Approved" | "Rejected" | "Pending";
    status: "Active" | "Inactive";
    addToHero: "Yes" | "No";
}

function normalizeDate(value: string | null | undefined): string {
    if (!value) return "";
    const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
    return dateMatch?.[0] || "";
}

function getTodayDateOnly(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function isEventEnded(eventEndDate: string): boolean {
    return Boolean(eventEndDate && eventEndDate <= getTodayDateOnly());
}

function isEventActiveDuringWindow(event: Pick<UpcomingEvent, "eventStartDate" | "eventEndDate">): boolean {
    const today = getTodayDateOnly();
    return Boolean(event.eventStartDate && event.eventEndDate && today >= event.eventStartDate && today <= event.eventEndDate);
}

// 🎯 Backend nu QuoteData ne frontend na UpcomingEvent ma convert karo
function mapQuoteToEvent(q: QuoteData): UpcomingEvent {
    const dateValue = normalizeDate(q.event_date) || new Date().toISOString().split("T")[0];
    return {
        id: q.id,
        image: q.image_url,
        description: q.description || "",
        date: dateValue,
        name: q.name || "",
        displayStartDate: normalizeDate(q.display_start_date) || dateValue,
        displayEndDate: normalizeDate(q.display_end_date) || dateValue,
        eventStartDate: normalizeDate(q.event_start_date) || dateValue,
        eventEndDate: normalizeDate(q.event_end_date) || dateValue,
        isApproved: q.is_approved || "Pending",
        status: q.event_start_date && q.event_end_date && isEventActiveDuringWindow({
            eventStartDate: normalizeDate(q.event_start_date),
            eventEndDate: normalizeDate(q.event_end_date),
        }) ? "Active" : (q.status || "Active"),
        addToHero: q.add_to_hero || "No",
    };
}

const UpcomingEvents: React.FC = () => {
    const confirm = useConfirm();
    const { theme } = useTheme();

    // State Management
    const [eventsList, setEventsList] = useState<UpcomingEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [activeEvent, setActiveEvent] = useState<UpcomingEvent | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null);

    // Draft Box States
    const [draftImageFile, setDraftImageFile] = useState<File | null>(null);
    const [draftImagePreview, setDraftImagePreview] = useState<string | null>(null);
    const [draftName, setDraftName] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftDisplayStartDate, setDraftDisplayStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [draftDisplayEndDate, setDraftDisplayEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [draftEventStartDate, setDraftEventStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [draftEventEndDate, setDraftEventEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [draftIsApproved, setDraftIsApproved] = useState<'Approved' | 'Rejected' | 'Pending'>('Pending');
    const [draftStatus, setDraftStatus] = useState<'Active' | 'Inactive'>('Active');
    const [draftAddToHero, setDraftAddToHero] = useState<'Yes' | 'No'>('No');

    // ફોર્મને ફોર્સફુલી રી-માઉન્ટ (રીસેટ) કરવા માટેની કી
    const [formKey, setFormKey] = useState(0);

    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false);
    const [cropFile, setCropFile] = useState<File | null>(null);
    const [isCropEditorOpen, setIsCropEditorOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🎯 FIX: Backend thi events fetch karo (localStorage nahi have)
    const fetchEvents = async () => {
        try {
            setLoading(true);
            const result = await quoteService.getQuotesByType("event", true);
            if (result.success) {
                setEventsList(result.data.map(mapQuoteToEvent));
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCroppedFile = (file: File) => {
        setDraftImageFile(file);
        setDraftImagePreview(URL.createObjectURL(file));
        setCropFile(null);
        setIsCropEditorOpen(false);
    };

    const processFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setCropFile(file);
            setIsCropEditorOpen(true);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    // ફોર્મને સંપૂર્ણપણે ખાલી (Reset) કરવા માટેનું ફંક્શન
    const resetDraft = () => {
        setDraftImageFile(null);
        setDraftImagePreview(null);
        setDraftName('');
        setDraftDescription('');
        setDraftDisplayStartDate('');
        setDraftDisplayEndDate('');
        setDraftEventStartDate('');
        setDraftEventEndDate('');
        setDraftIsApproved('Pending');
        setDraftStatus('Active');
        setDraftAddToHero('No');
        setFormKey(prev => prev + 1);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const loadEventIntoDraft = (event: UpcomingEvent) => {
        setDraftImageFile(null);
        setDraftImagePreview(event.image);
        setDraftName(event.name);
        setDraftDescription(event.description);
        setDraftDisplayStartDate(normalizeDate(event.displayStartDate));
        setDraftDisplayEndDate(normalizeDate(event.displayEndDate));
        setDraftEventStartDate(normalizeDate(event.eventStartDate));
        setDraftEventEndDate(normalizeDate(event.eventEndDate));
        setDraftIsApproved(event.isApproved);
        setDraftStatus(event.status);
        setDraftAddToHero(event.addToHero);
    };

    const openView = (event: UpcomingEvent) => {
        setActiveEvent(event);
        setModalMode('view');
    };

    const openEdit = (event: UpcomingEvent) => {
        loadEventIntoDraft(event);
        setActiveEvent(event);
        setModalMode('edit');
    };

    const closeModal = () => {
        setActiveEvent(null);
        setModalMode(null);
    };

    //  FIX: Backend par upload thay che, base64 localStorage nahi
    const handleSave = async () => {
        if (!draftImageFile) {
            toast.error("Please provide an image for the event.");
            return;
        }

        if (!draftName.trim()) {
            toast.error("Please provide a Name for the event.");
            return;
        }

        if (!draftEventStartDate) {
            toast.error("Please provide an Event Start Date.");
            return;
        }

        if (!draftDisplayStartDate) {
            toast.error("Please provide a Display Start Date.");
            return;
        }

        if (!draftDisplayEndDate) {
            toast.error("Please provide a Display End Date.");
            return;
        }

        if (!draftEventStartDate) {
            toast.error("Please provide an Event Start Date.");
            return;
        }

        if (!draftEventEndDate) {
            toast.error("Please provide an Event End Date.");
            return;
        }

        if (!draftIsApproved) {
            toast.error("Please provide the approval status.");
            return;
        }

        try {
            setSaving(true);
            const result = await quoteService.createQuote("event", draftImageFile, draftEventStartDate, draftDescription.trim(), {
                name: draftName.trim(),
                displayStartDate: draftDisplayStartDate,
                displayEndDate: draftDisplayEndDate,
                eventStartDate: draftEventStartDate,
                eventEndDate: draftEventEndDate,
                isApproved: draftIsApproved,
                status: isEventActiveDuringWindow({ eventStartDate: draftEventStartDate, eventEndDate: draftEventEndDate }) ? "Active" : draftStatus,
                addToHero: draftAddToHero,
            });

            if (result.success) {
                setEventsList((prev) => [...prev, mapQuoteToEvent(result.data)]);
                toast.success("Event saved successfully");
                resetDraft();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save event");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!activeEvent || !draftName.trim()) {
            toast.error("Please provide a Name for the event.");
            return;
        }
        const displayStartDate = normalizeDate(draftDisplayStartDate);
        const displayEndDate = normalizeDate(draftDisplayEndDate);
        const eventStartDate = normalizeDate(draftEventStartDate);
        const eventEndDate = normalizeDate(draftEventEndDate);
        if (!displayStartDate || !displayEndDate || !eventStartDate || !eventEndDate) {
            toast.error("Please provide all event dates.");
            return;
        }
        const effectiveStatus = isEventActiveDuringWindow({ eventStartDate, eventEndDate }) ? "Active" : draftStatus;
        try {
            setSaving(true);
            const result = await quoteService.updateQuote(activeEvent.id, draftImageFile, eventStartDate, draftDescription.trim(), {
                name: draftName.trim(),
                displayStartDate,
                displayEndDate,
                eventStartDate,
                eventEndDate,
                isApproved: draftIsApproved,
                status: effectiveStatus,
                addToHero: draftAddToHero,
            });
            if (result.success) {
                const updatedEvent = mapQuoteToEvent(result.data);
                setEventsList((prev) => prev.map((event) => event.id === updatedEvent.id ? {
                    ...updatedEvent,
                    date: eventStartDate,
                    displayStartDate,
                    displayEndDate,
                    eventStartDate,
                    eventEndDate,
                } : event));
                toast.success("Event updated successfully");
                closeModal();
                resetDraft();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update event");
        } finally {
            setSaving(false);
        }
    };

    const deleteEvent = async (id: number) => {
        if (!(await confirm({
            title: "Delete event?",
            message: "Are you sure you want to delete this event?",
            destructive: true,
        }))) return;
        setDeletingId(id);
        try {
            const result = await quoteService.deleteQuote(id);
            if (result.success) {
                setEventsList((prev) => prev.filter((ev) => ev.id !== id));
                toast.success("Event deleted");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete event");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className={`min-h-screen select-none p-6 md:p-8 font-sans transition-colors duration-500 relative ${theme ? "bg-[#050B14] text-slate-200" : "bg-[#F8FAFC] text-slate-900"}`}>

            {theme && (
                <>
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
                </>
            )}

            {/* PAGE HEADER */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className={`text-4xl font-black tracking-tight mb-2 ${theme ? "bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-300" : "bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-slate-600"}`}>
                        Upcoming Events
                    </h1>
                    <p className={`text-sm font-medium flex items-center gap-2 ${theme ? "text-slate-400" : "text-slate-500"}`}>
                        Curate and manage premium institutional events
                    </p>
                </div>
            </div>

            <div className="relative z-10 max-w-full mx-auto space-y-8">

                {/* LOADING STATE */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${theme ? "border-blue-500" : "border-red-600"}`} />
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* SAVED EVENTS LIST */}
                        {eventsList.length > 0 && (
                            <div className={`order-2 mb-10 overflow-hidden rounded-[1.75rem] border shadow-[0_24px_70px_-35px_rgba(15,23,42,0.45)] ${theme ? "border-slate-800/90 bg-[#0B1120]/95 shadow-black/30" : "border-slate-200/90 bg-white/95 shadow-slate-300/50"}`}>
                                <div className={`border-b px-6 py-5 ${theme ? "border-slate-800/90 bg-linear-to-r from-slate-900/80 via-[#0B1120] to-blue-950/20" : "border-slate-200/90 bg-linear-to-r from-white via-slate-50 to-red-50/30"}`}>
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className={`text-[10px] font-bold uppercase tracking-[0.28em] ${theme ? "text-blue-400" : "text-red-500"}`}>Curated collection</p>
                                            <h2 className={`mt-1 text-xl font-bold tracking-tight ${theme ? "text-slate-100" : "text-slate-800"}`}>Saved Events</h2>
                                        </div>
                                        <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${theme ? "border-blue-500/20 bg-blue-500/10 text-blue-300" : "border-red-200 bg-red-50 text-red-600"}`}>{eventsList.length} {eventsList.length === 1 ? "event" : "events"}</span>
                                    </div>
                                </div>
                                <div className={`hidden md:grid md:grid-cols-[96px_minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-4 border-b px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] ${theme ? "border-slate-800/80 text-slate-500" : "border-slate-200 text-slate-400"}`}>
                                    <span>Image</span>
                                    <span>Event Name</span>
                                    <span>Description</span>
                                    <span>Options</span>
                                </div>
                                {eventsList.map((event) => (
                                    <div key={event.id} className={`group grid grid-cols-1 md:grid-cols-[96px_minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-4 border-b px-6 py-5 last:border-b-0 ${theme ? "border-slate-800/70 hover:bg-slate-900/70" : "border-slate-100 hover:bg-slate-50/80"} ${deletingId === event.id ? "opacity-50" : ""}`}>
                                        <div className={`relative h-16 w-24 overflow-hidden rounded-xl ring-1 ${theme ? "ring-white/10" : "ring-slate-200"}`}>
                                            <img src={event.image} alt={event.name || "Event"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-linear-to-tr from-black/25 to-transparent" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`truncate text-sm font-bold tracking-tight ${theme ? "text-slate-100" : "text-slate-800"}`}>{event.name || "Untitled event"}</p>
                                            {isEventEnded(event.eventEndDate) && (
                                                <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme
                                                    ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                                                    : "border-red-500 bg-red-200 text-red-700"
                                                    }`}>
                                                    Event End
                                                </span>
                                            )}
                                            {event.isApproved !== "Approved" && (
                                                <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${event.isApproved === "Rejected"
                                                    ? theme ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-700"
                                                    : theme ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-700"
                                                    }`}>
                                                    {event.isApproved}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`line-clamp-2 text-sm leading-6 ${theme ? "text-slate-400" : "text-slate-600"}`}>{event.description || "No description provided"}</p>
                                        <UserActionMenu onView={() => openView(event)} onEdit={() => openEdit(event)} onDelete={() => deleteEvent(event.id)} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* DRAFTING BOX WITH PREMIUM BORDER */}
                        <div key={formKey} className="relative order-1 mb-20 animate-in fade-in slide-in-from-bottom-8">

                            {/* BACKGROUND WRAPPER */}
                            <div className={`absolute inset-0 rounded-4xl border-2 backdrop-blur-xl overflow-hidden transition-all duration-500 ${theme
                                ? "bg-[#111827]/90 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(59,130,246,0.1)]"
                                : "bg-white/95 border-slate-200 shadow-[0_20px_50px_rgba(148,163,184,0.15)]"
                                }`}
                            >
                                {/* Top Premium Subtle Accent Light */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${theme ? "from-blue-500 via-indigo-500 to-purple-500" : "from-red-400 via-orange-400 to-sky-400"}`} />
                            </div>

                            {/* CONTENT WRAPPER */}
                            <div className="relative z-10 p-6 md:p-10">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b pb-6 border-slate-500/30 relative z-50">
                                    <div className="flex items-center gap-3">
                                        <h2 className={`text-2xl font-bold tracking-wide ${theme ? "text-white" : "text-slate-800"}`}>
                                            Design New Event
                                        </h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 relative z-40">
                                    <div className="relative z-60">
                                        <label className={`mb-2 block text-sm font-semibold ${theme ? "text-slate-200" : "text-slate-700"}`}>
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={draftName}
                                            onChange={(e) => setDraftName(e.target.value)}
                                            placeholder="Event name"
                                            className={`w-full select-text rounded-xl border px-4 py-3 text-sm outline-none transition-all ${theme
                                                ? "border-gray-700/60 bg-[#1f2937]/80 text-white placeholder:text-gray-500 transition-all duration-500 hover:border-blue-500/50 hover:bg-[#1f2937] focus:border-blue-500 focus:bg-[#1f2937] focus:ring-2 focus:ring-blue-500/20"
                                                : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 transition-all duration-500 hover:border-red-400/60 hover:bg-white focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/10"
                                                }`}
                                        />
                                    </div>

                                    <div className="relative z-55">
                                        <SearchableDropdown
                                            label="Is Approved"
                                            placeholder="Select approval status"
                                            searchPlaceholder="Search approval status..."
                                            options={[{ value: "Approved", label: "Approved" }, { value: "Rejected", label: "Rejected" }, { value: "Pending", label: "Pending" }]}
                                            selectedValue={draftIsApproved}
                                            onSelect={(value) => setDraftIsApproved(String(value) as 'Approved' | 'Rejected' | 'Pending')}
                                            required
                                        />
                                    </div>

                                    {/* 🎯 FIX: Individual isolated wrapper for each DateField to prevent shared hover states */}
                                    <div className="relative z-50">
                                        <DateField
                                            label="Display Start Date"
                                            value={draftDisplayStartDate}
                                            onChange={setDraftDisplayStartDate}
                                            theme={theme}
                                            required={true}
                                        />
                                    </div>

                                    <div className="relative z-45">
                                        <DateField
                                            label="Display End Date"
                                            value={draftDisplayEndDate}
                                            onChange={setDraftDisplayEndDate}
                                            theme={theme}
                                            required={true}
                                        />
                                    </div>

                                    <div className="relative z-40">
                                        <DateField
                                            label="Event Start Date"
                                            value={draftEventStartDate}
                                            onChange={setDraftEventStartDate}
                                            theme={theme}
                                            required={true}
                                        />
                                    </div>

                                    <div className="relative z-35">
                                        <DateField
                                            label="Event End Date"
                                            value={draftEventEndDate}
                                            onChange={setDraftEventEndDate}
                                            theme={theme}
                                            required={true}
                                        />
                                    </div>

                                    <div className="relative z-30">
                                        <SearchableDropdown
                                            label="Status"
                                            placeholder="Select status"
                                            searchPlaceholder="Search status..."
                                            options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]}
                                            selectedValue={isEventActiveDuringWindow({ eventStartDate: draftEventStartDate, eventEndDate: draftEventEndDate }) ? "Active" : draftStatus}
                                            onSelect={(value) => setDraftStatus(String(value) as 'Active' | 'Inactive')}
                                            disabled={isEventActiveDuringWindow({ eventStartDate: draftEventStartDate, eventEndDate: draftEventEndDate })}
                                        />
                                    </div>

                                    <div className="relative z-20">
                                        <SearchableDropdown
                                            label="Is Display Main Page"
                                            placeholder="Select visibility"
                                            searchPlaceholder="Search visibility..."
                                            options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]}
                                            selectedValue={draftAddToHero}
                                            onSelect={(value) => setDraftAddToHero(String(value) as 'Yes' | 'No')}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* IMAGE UPLOAD & DESCRIPTION */}
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">

                                    {/* IMAGE UPLOAD CONTAINER */}
                                    <div className="lg:col-span-2">
                                        <label
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            htmlFor="event-image-upload"
                                            className={`relative flex flex-col items-center justify-center w-full h-64 rounded-3xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-300 ${isDragging
                                                ? theme ? "border-blue-400 bg-blue-500/10 scale-[1.02]" : "border-blue-500 bg-blue-50 scale-[1.02]"
                                                : theme
                                                    ? "border-slate-800 hover:border-blue-500/50 bg-[#0B1120]/70 hover:bg-[#0B1120]"
                                                    : "border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-slate-50"
                                                }`}
                                        >
                                            <input id="event-image-upload" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />

                                            {draftImagePreview ? (
                                                <>
                                                    <img src={draftImagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-white text-sm font-medium border border-white/30">
                                                            Change Image
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center p-6">
                                                    <div className={`p-4 rounded-full mb-4 transition-transform duration-300 ${theme ? "bg-slate-800/80 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10" : "bg-white shadow-sm text-slate-400 hover:text-blue-500 hover:bg-blue-50"}`}>
                                                        <Upload size={28} strokeWidth={1.5} />
                                                    </div>
                                                    <p className={`text-sm font-bold mb-1 ${theme ? "text-slate-300" : "text-slate-700"}`}>
                                                        Click to upload or drag and drop
                                                    </p>
                                                    <p className={`text-xs ${theme ? "text-slate-500" : "text-slate-400"}`}>
                                                        SVG, PNG, JPG or WEBP
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    {/* DESCRIPTION TEXTAREA */}
                                    <div className="lg:col-span-3 flex flex-col h-full">
                                        <div className={`flex-1 rounded-3xl border-2 overflow-hidden focus-within:ring-4 transition-all duration-300 ${theme
                                            ? "bg-[#0B1120] border-slate-800 focus-within:border-blue-500/60 focus-within:ring-blue-500/15"
                                            : "bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:ring-blue-500/10"
                                            }`}>
                                            <textarea
                                                value={draftDescription}
                                                onChange={(e) => setDraftDescription(e.target.value)}
                                                placeholder="Capture the essence of the event here"
                                                className={`w-full h-full min-h-40 select-text overflow-y-auto scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] p-6 text-base md:text-lg resize-none outline-none bg-transparent leading-relaxed font-serif transition-colors ${theme
                                                    ? "text-slate-100 placeholder:text-slate-500"
                                                    : "text-slate-800 placeholder:text-slate-400"
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* BUTTON ACTION AREA */}
                                <div className={`mt-8 pt-6 border-t flex flex-wrap justify-end gap-4 ${theme ? "border-slate-800" : "border-slate-200"}`}>
                                    <button
                                        onClick={resetDraft}
                                        disabled={saving}
                                        className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${theme ? "text-slate-300 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
                                    >
                                        <X size={18} strokeWidth={2.5} />
                                        Clear
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className={`px-10 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-60 ${theme
                                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40 hover:shadow-blue-600/50"
                                            : "bg-red-600 text-white hover:bg-red-700 shadow-red-900/10 hover:shadow-red-900/20"
                                            }`}
                                    >
                                        {saving ? (
                                            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                        ) : (
                                            <Save size={18} strokeWidth={2.5} />
                                        )}
                                        {saving ? "Saving..." : "Save Event"}
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                )}

            </div>

            <ImageCropEditor
                file={cropFile}
                isOpen={isCropEditorOpen}
                theme={theme}
                shape="square"
                title="Edit Event Image"
                subtitle="Position and zoom the cover image to fit perfectly"
                onClose={() => {
                    setCropFile(null);
                    setIsCropEditorOpen(false);
                }}
                onCropped={handleCroppedFile}
            />

            <Modal
                open={Boolean(activeEvent && modalMode)}
                onClose={closeModal}
                ariaLabel="Event details"
                className="max-w-3xl p-0"
            >
                {activeEvent && modalMode && (
                    <div className={`max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border shadow-2xl ${theme ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"}`} onMouseDown={(event) => event.stopPropagation()}>
                        <div className={`flex items-center justify-between border-b px-6 py-4 ${theme ? "border-slate-800" : "border-slate-200"}`}>
                            <div>
                                <h2 className="text-lg font-bold">{modalMode === 'view' ? 'Event Preview' : 'Edit Event'}</h2>
                                <p className={`text-sm ${theme ? "text-slate-400" : "text-slate-500"}`}>{activeEvent.name || "Untitled event"}</p>
                            </div>
                            <button type="button" onClick={closeModal} aria-label="Close event dialog" className={`rounded-full p-2 ${theme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}><X size={18} /></button>
                        </div>

                        {modalMode === 'view' ? (
                            <div className="space-y-6 p-6">
                                <img src={activeEvent.image} alt={activeEvent.name || "Event"} className="h-64 w-full rounded-xl object-cover" />
                                <div className="grid gap-5 sm:grid-cols-2">
                                    {[
                                        ["Event Name", activeEvent.name], ["Description", activeEvent.description || "No description provided"],
                                        ["Display Start Date", activeEvent.displayStartDate],
                                        ["Display End Date", activeEvent.displayEndDate], ["Event Start Date", activeEvent.eventStartDate],
                                        ["Event End Date", activeEvent.eventEndDate], ["Approval", activeEvent.isApproved],
                                        ["Status", activeEvent.status], ["Display Main Page", activeEvent.addToHero],
                                    ].map(([label, value]) => (
                                        <div key={label} className={label === "Description" ? "sm:col-span-2" : ""}>
                                            <p className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
                                            <p className="mt-1 whitespace-pre-wrap text-sm font-medium">{value || "-"}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => openEdit(activeEvent)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white ${theme ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-700"}`}><Pencil size={16} /> Edit</button>
                                </div>
                            </div>
                        ) : (
                            <form className="space-y-5 p-6" onSubmit={(event) => { event.preventDefault(); void handleUpdate(); }}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="space-y-1 sm:col-span-2"><span className="text-sm font-semibold">Event Name</span><input value={draftName} onChange={(event) => setDraftName(event.target.value)} required className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`} /></label>
                                    <label className="space-y-1 sm:col-span-2"><span className="text-sm font-semibold">Description</span><textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} rows={4} className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`} /></label>
                                    {[['Display Start Date', draftDisplayStartDate, setDraftDisplayStartDate], ['Display End Date', draftDisplayEndDate, setDraftDisplayEndDate], ['Event Start Date', draftEventStartDate, setDraftEventStartDate], ['Event End Date', draftEventEndDate, setDraftEventEndDate]].map(([label, value, setter]) => (
                                        <DatePicker key={`${activeEvent.id}-${label as string}`} label={label as string} selectedValue={normalizeDate(value as string)} onChange={setter as React.Dispatch<React.SetStateAction<string>>} required />
                                    ))}
                                    <SearchableDropdown label="Approval" placeholder="Select approval status" searchPlaceholder="Search approval status..." options={[{ value: "Approved", label: "Approved" }, { value: "Rejected", label: "Rejected" }, { value: "Pending", label: "Pending" }]} selectedValue={draftIsApproved} onSelect={(value) => setDraftIsApproved(String(value) as UpcomingEvent['isApproved'])} required />
                                    <SearchableDropdown label="Status" placeholder="Select status" searchPlaceholder="Search status..." options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} selectedValue={isEventActiveDuringWindow({ eventStartDate: draftEventStartDate, eventEndDate: draftEventEndDate }) ? "Active" : draftStatus} onSelect={(value) => setDraftStatus(String(value) as UpcomingEvent['status'])} disabled={isEventActiveDuringWindow({ eventStartDate: draftEventStartDate, eventEndDate: draftEventEndDate })} />
                                    <SearchableDropdown label="Display Main Page" placeholder="Select visibility" searchPlaceholder="Search visibility..." options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]} selectedValue={draftAddToHero} onSelect={(value) => setDraftAddToHero(String(value) as UpcomingEvent['addToHero'])} required />
                                    <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-end">
                                        <div className="w-full space-y-2 sm:max-w-md">
                                            <span
                                                className={`block text-xs font-semibold tracking-wider uppercase ${theme ? "text-slate-400" : "text-slate-500"
                                                    }`}
                                            >
                                                Replace Image
                                            </span>

                                            <label
                                                htmlFor="edit-event-image-upload"
                                                className={`group relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border transition-all duration-500 ease-out shadow-sm ${theme
                                                    ? "border-slate-800 bg-linear-to-b from-slate-900/90 to-slate-950/90 hover:border-slate-600/80 hover:shadow-xl hover:shadow-indigo-500/10"
                                                    : "border-slate-200/80 bg-linear-to-b from-slate-50 to-stone-100/60 hover:border-slate-400 hover:shadow-xl hover:shadow-slate-300/40"
                                                    }`}
                                            >
                                                <input
                                                    id="edit-event-image-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(event) => {
                                                        const file = event.target.files?.[0];
                                                        if (file) processFile(file);
                                                    }}
                                                    className="hidden"
                                                />

                                                {draftImagePreview ? (
                                                    <>
                                                        {/* Clean Image Preview (Normal State) */}
                                                        <img
                                                            src={draftImagePreview}
                                                            alt="Current event"
                                                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                        />

                                                        {/* Hover Overlay & Placeholder Badge (Only visible on hover) */}
                                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[3px] opacity-0 transition-all duration-300 ease-out group-hover:opacity-100">
                                                            <span className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-white shadow-xl backdrop-blur-md transition-all duration-300 translate-y-2 group-hover:translate-y-0 group-hover:bg-white/20">
                                                                <Upload size={14} className="text-white/90" />
                                                                Replace Image
                                                            </span>
                                                        </div>

                                                    </>
                                                ) : (
                                                    /* Empty State with Luxury Pill & Soft Text */
                                                    <div className="flex flex-col items-center gap-2.5 p-4 text-center">
                                                        <div
                                                            className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-110 ${theme
                                                                ? "border-slate-700/60 bg-slate-800/80 text-slate-300 shadow-inner group-hover:border-indigo-400/50 group-hover:bg-slate-800 group-hover:text-indigo-300 group-hover:shadow-indigo-500/20"
                                                                : "border-slate-200 bg-white text-slate-600 shadow-sm group-hover:border-slate-400 group-hover:bg-slate-50 group-hover:text-slate-900 group-hover:shadow-md"
                                                                }`}
                                                        >
                                                            <Upload
                                                                size={18}
                                                                className="transition-transform duration-300 group-hover:-translate-y-0.5"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span
                                                                className={`text-xs font-semibold tracking-wide ${theme ? "text-slate-200" : "text-slate-700"
                                                                    }`}
                                                            >
                                                                Click to replace image
                                                            </span>
                                                            <span
                                                                className={`text-[11px] ${theme ? "text-slate-400" : "text-slate-500"
                                                                    }`}
                                                            >
                                                                SVG, PNG, JPG or GIF (max. 5MB)
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                        <div className="flex shrink-0 gap-3 sm:pb-0.5">
                                            <button type="button" onClick={closeModal} className={`rounded-xl px-4 py-2 text-sm font-semibold ${theme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}>Cancel</button>
                                            <button type="submit" disabled={saving} className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 ${theme ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-700"}`}><Save size={16} />{saving ? "Saving..." : "Save"}</button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </Modal>
        </div >
    );
};

export default UpcomingEvents;