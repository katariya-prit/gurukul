import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
    AlertCircle,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Images,
    Save,
    Search,
    Trash2,
    X,
    List,
    PlusCircle,
    UploadCloud
} from "lucide-react";
import { toast } from "sonner";
import DatePicker from "../../../components/common/Calendar";
import { useTheme } from "../../../components/theme/ThemeContext";
import { quoteService, type QuoteData } from "../../../services/Quoteservice";
import TabSwitcher, { type TabItem } from "../../../components/common/TabSwitcher";

const GROUP_PREFIX = "__GURUKUL_ACTIVITY_GROUP_V1__";
const MAX_DESCRIPTION_LENGTH = 500;

interface ActivityImage {
    id: number;
    url: string;
}

type ActivityTab = "list" | "create";

const ACTIVITY_TABS: TabItem<ActivityTab>[] = [
    { key: "list", label: "Activities List", icon: List },
    { key: "create", label: "Create Activity", icon: PlusCircle },
];

interface ActivityData {
    id: number;
    image: string;
    description: string;
    title: string;
    date: string;
    groupId?: string;
}

interface ActivityGroup {
    id: string;
    title: string;
    description: string;
    date: string;
    images: ActivityImage[];
}

interface GroupPayload {
    groupId: string;
    title: string;
    description: string;
}

interface SelectedImage {
    id: string;
    file: File;
    preview: string;
}

function createGroupId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function encodeGroupDescription(payload: GroupPayload) {
    return `${GROUP_PREFIX}${JSON.stringify(payload)}`;
}

function decodeGroupDescription(rawDescription?: string | null) {
    const raw = rawDescription || "";

    if (!raw.startsWith(GROUP_PREFIX)) {
        return {
            title: "Gurukul Activity",
            description: raw,
            groupId: undefined,
        };
    }

    try {
        const payload = JSON.parse(raw.slice(GROUP_PREFIX.length)) as GroupPayload;

        return {
            title: payload.title?.trim() || "Gurukul Activity",
            description: payload.description || "",
            groupId: payload.groupId,
        };
    } catch {
        return {
            title: "Gurukul Activity",
            description: raw,
            groupId: undefined,
        };
    }
}

function mapQuoteToActivity(q: QuoteData): ActivityData {
    const metadata = decodeGroupDescription(q.description);

    return {
        id: q.id,
        image: q.image_url,
        title: metadata.title,
        description: metadata.description,
        groupId: metadata.groupId,
        date: q.event_date.split("T")[0],
    };
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 220, damping: 18 },
    },
};

const Activities: React.FC = () => {
    const { theme } = useTheme();

    const [activeTab, setActiveTab] = useState<ActivityTab>("list");
    const [dataList, setDataList] = useState<ActivityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
    const [headerDate, setHeaderDate] = useState(new Date().toISOString().split("T")[0]);

    const [attemptedSave, setAttemptedSave] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedGroup, setSelectedGroup] = useState<ActivityGroup | null>(null);
    const [galleryIndex, setGalleryIndex] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const selectedImagesRef = useRef<SelectedImage[]>([]);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true);

                const result = await quoteService.getQuotesByType("activity");

                if (result.success && result.data) {
                    setDataList(result.data.map(mapQuoteToActivity));
                }
            } catch (error: unknown) {
                toast.error(error instanceof Error ? error.message : "Failed to load activities");
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    useEffect(() => {
        selectedImagesRef.current = selectedImages;
    }, [selectedImages]);

    useEffect(() => {
        return () => {
            selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
        };
    }, []);

    const titleError = attemptedSave && !title.trim();
    const imagesError = attemptedSave && selectedImages.length === 0;

    const selectedMonthString = headerDate.substring(0, 7);

    const formattedMonthName = new Date(`${headerDate}T00:00:00`).toLocaleString("default", {
        month: "long",
        year: "numeric",
    });

    const displayData = useMemo(() => {
        const monthItems = dataList.filter(
            (item) => item.date.substring(0, 7) === selectedMonthString
        );

        const groupMap = new Map<string, ActivityGroup>();

        monthItems.forEach((item) => {
            const groupId = item.groupId || `legacy-activity-${item.id}`;
            const existing = groupMap.get(groupId);

            if (existing) {
                if (!existing.images.some((image) => image.id === item.id)) {
                    existing.images.push({ id: item.id, url: item.image });
                }
                return;
            }

            groupMap.set(groupId, {
                id: groupId,
                title: item.title,
                description: item.description,
                date: item.date,
                images: [{ id: item.id, url: item.image }],
            });
        });

        return Array.from(groupMap.values()).map((group) => ({
            ...group,
            images: [...group.images].sort((a, b) => a.id - b.id),
        }));
    }, [dataList, selectedMonthString]);

    const filteredData = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) return displayData;

        return displayData.filter(
            (group) =>
                group.title.toLowerCase().includes(query) ||
                group.description.toLowerCase().includes(query)
        );
    }, [displayData, searchQuery]);

    const addFiles = useCallback((incoming: FileList | File[]) => {
        const files = Array.from(incoming).filter((file) => file.type.startsWith("image/"));

        if (!files.length) {
            toast.error("Please select valid image files.");
            return;
        }

        setSelectedImages((current) => [
            ...current,
            ...files.map((file) => ({
                id: `${file.name}-${file.lastModified}-${Math.random()}`,
                file,
                preview: URL.createObjectURL(file),
            })),
        ]);
    }, []);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length) {
            addFiles(event.target.files);
        }

        event.target.value = "";
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        setDragActive(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setDragActive(false);

        if (event.dataTransfer.files?.length) {
            addFiles(event.dataTransfer.files);
        }
    };

    const removeSelectedImage = (id: string) => {
        setSelectedImages((current) => {
            const image = current.find((item) => item.id === id);

            if (image) {
                URL.revokeObjectURL(image.preview);
            }

            return current.filter((item) => item.id !== id);
        });
    };

    const clearSelectedImages = () => {
        selectedImages.forEach((image) => URL.revokeObjectURL(image.preview));
        setSelectedImages([]);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const moveSelectedImage = (index: number, direction: -1 | 1) => {
        setSelectedImages((current) => {
            const target = index + direction;

            if (target < 0 || target >= current.length) return current;

            const next = [...current];
            [next[index], next[target]] = [next[target], next[index]];

            return next;
        });
    };

    const resetForm = () => {
        selectedImages.forEach((image) => URL.revokeObjectURL(image.preview));

        setSelectedImages([]);
        setTitle("");
        setDescription("");
        setAttemptedSave(false);
        setDragActive(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSave = async () => {
        if (saving) return;

        setAttemptedSave(true);

        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();

        if (!trimmedTitle) {
            toast.error("Give this collection a title before saving.");
            titleInputRef.current?.focus();
            return;
        }

        if (!selectedImages.length) {
            toast.error("Select at least one image to save.");
            return;
        }

        const imagesToUpload = [...selectedImages];
        const groupId = createGroupId();

        const encodedDescription = encodeGroupDescription({
            groupId,
            title: trimmedTitle,
            description: trimmedDescription,
        });

        try {
            setSaving(true);
            setUploadProgress({ current: 0, total: imagesToUpload.length });

            const results = await Promise.allSettled(
                imagesToUpload.map(async (image) => {
                    const result = await quoteService.createQuote(
                        "activity",
                        image.file,
                        headerDate,
                        encodedDescription
                    );

                    if (!result.success || !result.data) {
                        throw new Error(`Failed to upload image: ${image.file.name}`);
                    }

                    setUploadProgress((previous) =>
                        previous
                            ? { ...previous, current: previous.current + 1 }
                            : null
                    );

                    return mapQuoteToActivity(result.data);
                })
            );

            const successfulItems = results
                .filter(
                    (result): result is PromiseFulfilledResult<ActivityData> =>
                        result.status === "fulfilled"
                )
                .map((result) => result.value);

            const failedCount = results.length - successfulItems.length;

            if (successfulItems.length === 0) {
                toast.error("Failed to save activity. Please try again.");
                return;
            }

            setDataList((current) => [...successfulItems, ...current]);

            resetForm();
            setActiveTab("list");

            if (failedCount > 0) {
                toast.warning(
                    `${successfulItems.length} image(s) saved, but ${failedCount} failed to upload.`
                );
            } else {
                toast.success(
                    `Activity "${trimmedTitle}" created successfully with ${successfulItems.length} image(s).`
                );
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to save activity.");
        } finally {
            setSaving(false);
            setUploadProgress(null);
        }
    };

    const openModal = (group: ActivityGroup, initialIndex = 0) => {
        setSelectedGroup(group);
        setGalleryIndex(initialIndex);
    };

    const closeModal = () => {
        setSelectedGroup(null);
        setGalleryIndex(0);
    };

    const handleNext = useCallback(
        (event?: React.MouseEvent) => {
            event?.stopPropagation();

            if (selectedGroup && galleryIndex < selectedGroup.images.length - 1) {
                setGalleryIndex((current) => current + 1);
            }
        },
        [galleryIndex, selectedGroup]
    );

    const handlePrev = useCallback(
        (event?: React.MouseEvent) => {
            event?.stopPropagation();

            if (galleryIndex > 0) {
                setGalleryIndex((current) => current - 1);
            }
        },
        [galleryIndex]
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!selectedGroup) return;

            if (event.key === "ArrowRight") handleNext();
            if (event.key === "ArrowLeft") handlePrev();
            if (event.key === "Escape") closeModal();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNext, handlePrev, selectedGroup]);

    const panelClass = theme
        ? "bg-[#151D2F] border-slate-800"
        : "bg-slate-50 border-slate-200";

    const inputClass = theme
        ? "bg-[#0B1120] border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/30"
        : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:ring-red-500/20";

    const errorInputClass = theme
        ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
        : "border-red-400 focus:border-red-500 focus:ring-red-500/20";

    const focusRingClass = theme
        ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]"
        : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

    return (
        <div
            className={`relative mx-auto flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 transition-colors duration-300 ${theme ? "bg-[#0B1120] text-slate-200" : "bg-white text-slate-900"
                }`}
        >
            {theme && (
                <div className="pointer-events-none fixed -left-20 -top-20 z-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
            )}

            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-30 w-full"
            >
                <div
                    className={`relative z-30 flex flex-col items-center justify-between gap-5 rounded-3xl border p-6 transition-all duration-500 sm:p-8 md:flex-row ${theme
                            ? "bg-linear-to-r from-[#151D2F] to-[#0B1120] border-slate-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
                            : "bg-linear-to-r from-white to-slate-50 border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
                        }`}
                >
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <p className={`text-xs font-bold uppercase tracking-[0.25em] ${theme ? "text-blue-400" : "text-red-600"}`}>
                            Gurukul Archives
                        </p>

                        <h1
                            className={`text-3xl font-black tracking-tight sm:text-4xl ${theme
                                    ? "bg-linear-to-r from-blue-200 via-blue-400 to-blue-500 bg-clip-text text-transparent"
                                    : "bg-linear-to-r from-slate-800 via-slate-600 to-slate-400 bg-clip-text text-transparent"
                                }`}
                        >
                            Activities Overview
                        </h1>

                        <p className={`text-sm font-medium ${theme ? "text-slate-400" : "text-slate-500"}`}>
                            Curate every educational, spiritual, and cultural memory.
                        </p>
                    </div>

                    <div className="relative z-30 w-full md:w-64">
                        <DatePicker label="" selectedValue={headerDate} onChange={setHeaderDate} />
                    </div>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative z-20 flex w-full justify-center sm:justify-start"
            >
                <TabSwitcher tabs={ACTIVITY_TABS} activeTab={activeTab} onChange={setActiveTab} />
            </motion.div>

            <main className="relative z-10 flex-1">
                <AnimatePresence mode="wait">
                    {activeTab === "create" ? (
                        <motion.section
                            key="create-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className={`mx-auto max-w-full rounded-3xl border p-6 sm:p-8 shadow-xl transition-all ${panelClass}`}
                        >
                            <div className="mb-6 text-center sm:text-left">
                                <h2 className={`text-2xl font-black sm:text-3xl ${theme ? "text-white" : "text-slate-900"}`}>
                                    Create New Activity
                                </h2>

                                <p className={`mt-1 text-sm ${theme ? "text-slate-400" : "text-slate-500"}`}>
                                    Add memories, photos, and descriptions for a new activity collection.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="activity-title"
                                        className={`mb-2 block text-xs font-bold uppercase tracking-wider ${theme ? "text-slate-300" : "text-slate-700"}`}
                                    >
                                        Title
                                    </label>

                                    <input
                                        id="activity-title"
                                        ref={titleInputRef}
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        placeholder="e.g. Activity Collection Title"
                                        aria-invalid={titleError}
                                        className={`h-12 w-full rounded-xl border px-4 text-base outline-none transition-all duration-300 ${titleError ? errorInputClass : inputClass
                                            }`}
                                    />

                                    {titleError && (
                                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
                                            <AlertCircle size={14} /> A title is required.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label
                                            htmlFor="activity-description"
                                            className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-slate-300" : "text-slate-700"}`}
                                        >
                                            Description
                                        </label>

                                        <span className={`text-xs font-semibold ${theme ? "text-slate-500" : "text-slate-400"}`}>
                                            {description.length}/{MAX_DESCRIPTION_LENGTH}
                                        </span>
                                    </div>

                                    <textarea
                                        id="activity-description"
                                        value={description}
                                        maxLength={MAX_DESCRIPTION_LENGTH}
                                        onChange={(event) => setDescription(event.target.value)}
                                        placeholder="Write details about this event..."
                                        className={`min-h-32 w-full resize-y rounded-xl border p-4 text-sm leading-relaxed outline-none transition-all duration-300 ${inputClass}`}
                                    />
                                </div>

                                <div>
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <label className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-slate-300" : "text-slate-700"}`}>
                                            Select Images
                                        </label>

                                        {selectedImages.length > 0 && (
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${theme
                                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                        : "bg-red-50 text-red-600 border border-red-200"
                                                    }`}>
                                                    {selectedImages.length} Image{selectedImages.length > 1 ? "s" : ""} Selected
                                                </span>

                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    type="button"
                                                    onClick={clearSelectedImages}
                                                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${theme
                                                            ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white shadow-red-950/20"
                                                            : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white shadow-red-100"
                                                        }`}
                                                >
                                                    <Trash2 size={13} />
                                                    Clear All
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => !selectedImages.length && fileInputRef.current?.click()}
                                        className={`relative flex min-h-52 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 ${dragActive
                                                ? theme
                                                    ? "scale-[1.01] border-blue-400 bg-blue-500/10"
                                                    : "scale-[1.01] border-red-400 bg-red-50"
                                                : imagesError
                                                    ? errorInputClass
                                                    : selectedImages.length > 0
                                                        ? theme
                                                            ? "border-slate-700 bg-[#0B1120]/40"
                                                            : "border-slate-200 bg-white"
                                                        : theme
                                                            ? "cursor-pointer border-slate-700 bg-[#0B1120]/50 hover:border-blue-500/50"
                                                            : "cursor-pointer border-slate-300 bg-slate-50 hover:border-red-400"
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />

                                        {selectedImages.length ? (
                                            <div className="w-full">
                                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                                    {selectedImages.map((image, index) => (
                                                        <motion.div
                                                            key={image.id}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="group relative aspect-square overflow-hidden rounded-xl shadow-sm hover:shadow-md"
                                                        >
                                                            <img
                                                                src={image.preview}
                                                                alt={`Selected ${index + 1}`}
                                                                className="h-full w-full object-cover"
                                                            />

                                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                                <div className="flex gap-1.5">
                                                                    {index > 0 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                moveSelectedImage(index, -1);
                                                                            }}
                                                                            className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40"
                                                                        >
                                                                            <ChevronLeft size={14} />
                                                                        </button>
                                                                    )}

                                                                    {index < selectedImages.length - 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                moveSelectedImage(index, 1);
                                                                            }}
                                                                            className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40"
                                                                        >
                                                                            <ChevronRight size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        removeSelectedImage(image.id);
                                                                    }}
                                                                    className="rounded-full bg-red-500/80 p-1.5 text-white hover:bg-red-500"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>

                                                            {index === 0 && (
                                                                <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase text-white backdrop-blur-xs">
                                                                    Cover
                                                                </span>
                                                            )}
                                                        </motion.div>
                                                    ))}

                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            fileInputRef.current?.click();
                                                        }}
                                                        className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-all ${theme
                                                                ? "border-slate-700 bg-[#0B1120] text-blue-400 hover:border-blue-500"
                                                                : "border-slate-300 bg-slate-50 text-red-600 hover:border-red-400"
                                                            }`}
                                                    >
                                                        <UploadCloud size={24} />
                                                        <span className="text-xs font-bold">Add More</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pointer-events-none flex flex-col items-center gap-2">
                                                <div className={`rounded-full p-4 ${theme ? "bg-blue-500/10 text-blue-400" : "bg-red-50 text-red-500"}`}>
                                                    <UploadCloud size={34} strokeWidth={1.5} />
                                                </div>

                                                <div>
                                                    <h3 className={`text-base font-bold ${theme ? "text-white" : "text-slate-900"}`}>
                                                        {dragActive ? "Drop images here" : "Click or drag images to upload"}
                                                    </h3>

                                                    <p className={`mt-1 text-xs ${theme ? "text-slate-400" : "text-slate-500"}`}>
                                                        First image will automatically serve as Cover image.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {imagesError && (
                                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
                                            <AlertCircle size={14} /> Select at least one image.
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white shadow-lg transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${focusRingClass} ${theme
                                                ? "bg-linear-to-r from-blue-600 to-blue-500 shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400"
                                                : "bg-linear-to-r from-red-600 to-red-500 shadow-red-500/20 hover:from-red-500 hover:to-red-400"
                                            }`}
                                    >
                                        {saving ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        ) : (
                                            <Save size={18} />
                                        )}

                                        {saving
                                            ? `Saving ${uploadProgress?.current ?? 0} of ${uploadProgress?.total ?? selectedImages.length} Images...`
                                            : "Save Activity Collection"}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.section>
                    ) : (
                        <motion.div
                            key="list-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-col h-full gap-5"
                        >
                            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 shadow-xs transition-all ${panelClass}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`rounded-lg p-2.5 ${theme ? "bg-blue-500/10 text-blue-400" : "bg-red-50 text-red-600"}`}>
                                        <CalendarDays size={20} />
                                    </div>

                                    <div>
                                        <h2 className={`text-lg font-bold ${theme ? "text-white" : "text-slate-900"}`}>
                                            {formattedMonthName} Archives
                                        </h2>

                                        <p className={`text-xs font-medium ${theme ? "text-slate-400" : "text-slate-500"}`}>
                                            {filteredData.length} Collection{filteredData.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>

                                {displayData.length > 0 && (
                                    <div className="relative w-full sm:w-72">
                                        <Search size={16} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${theme ? "text-slate-500" : "text-slate-400"}`} />

                                        <input
                                            value={searchQuery}
                                            onChange={(event) => setSearchQuery(event.target.value)}
                                            placeholder="Search collections..."
                                            className={`h-10 w-full rounded-xl border pl-10 pr-9 text-xs outline-none transition-all duration-300 ${inputClass}`}
                                        />

                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery("")}
                                                className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors ${theme ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100"}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col gap-3 pb-10"
                            >
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((index) => (
                                            <div
                                                key={index}
                                                className={`animate-pulse rounded-2xl border p-4 flex items-center gap-4 ${theme ? "border-slate-800 bg-[#151D2F]" : "border-slate-200 bg-white"}`}
                                            >
                                                <div className={`h-24 w-36 rounded-xl shrink-0 ${theme ? "bg-slate-800" : "bg-slate-200"}`} />

                                                <div className="flex-1 space-y-2">
                                                    <div className={`h-5 w-1/3 rounded-md ${theme ? "bg-slate-800" : "bg-slate-200"}`} />
                                                    <div className={`h-3 w-2/3 rounded-md ${theme ? "bg-slate-800" : "bg-slate-200"}`} />
                                                </div>

                                                <div className={`h-8 w-24 rounded-lg shrink-0 ${theme ? "bg-slate-800" : "bg-slate-200"}`} />
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredData.length ? (
                                    filteredData.map((group) => (
                                        <motion.article
                                            key={group.id}
                                            variants={itemVariants}
                                            whileHover={{ scale: 1.008, x: 4 }}
                                            whileTap={{ scale: 0.995 }}
                                            onClick={() => openModal(group, 0)}
                                            className={`group cursor-pointer overflow-hidden rounded-2xl border p-3.5 sm:p-4 shadow-sm transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between ${theme
                                                    ? "border-slate-800 bg-[#151D2F] hover:border-blue-500/40 hover:bg-[#19243a]"
                                                    : "border-slate-200 bg-white hover:border-red-300 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="relative h-28 w-full sm:w-44 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                                                <img
                                                    src={group.images[0]?.url}
                                                    alt={group.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />

                                                {group.images.length > 1 && (
                                                    <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs flex items-center gap-1">
                                                        <Images size={12} /> +{group.images.length - 1} photos
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 w-full text-left">
                                                <h3 className={`text-lg font-bold transition-colors ${theme ? "text-slate-100 group-hover:text-blue-400" : "text-slate-900 group-hover:text-red-600"}`}>
                                                    {group.title}
                                                </h3>

                                                {group.description && (
                                                    <p className={`mt-1 text-xs line-clamp-2 leading-relaxed ${theme ? "text-slate-400" : "text-slate-600"}`}>
                                                        {group.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className={`shrink-0 flex items-center gap-2 sm:flex-col sm:items-end w-full sm:w-auto justify-between border-t sm:border-t-0 sm:border-l pt-2.5 sm:pt-0 sm:pl-4 ${theme ? "border-slate-700/30" : "border-slate-200"}`}>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme ? "text-slate-500" : "text-slate-400"}`}>
                                                    Date
                                                </span>

                                                <span className={`rounded-lg px-3 py-1 text-xs font-bold border ${theme ? "bg-[#0B1120] text-blue-400 border-slate-700" : "bg-slate-100 text-red-600 border-slate-200"}`}>
                                                    {group.date}
                                                </span>
                                            </div>
                                        </motion.article>
                                    ))
                                ) : displayData.length && searchQuery ? (
                                    <div className={`flex flex-col items-center justify-center rounded-2xl border py-16 ${panelClass}`}>
                                        <Search size={40} className={`opacity-20 ${theme ? "text-slate-400" : "text-slate-500"}`} />

                                        <p className={`mt-3 text-sm font-medium ${theme ? "text-slate-400" : "text-slate-500"}`}>
                                            No collections match "{searchQuery}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className={`flex flex-col items-center justify-center rounded-2xl border py-20 shadow-xs ${panelClass}`}>
                                        <div className={`rounded-full p-5 ${theme ? "bg-[#0B1120]" : "bg-slate-100"}`}>
                                            <Images size={36} className={`opacity-40 ${theme ? "text-slate-400" : "text-slate-500"}`} />
                                        </div>

                                        <h3 className={`mt-4 text-base font-bold ${theme ? "text-slate-300" : "text-slate-700"}`}>
                                            No activities found
                                        </h3>

                                        <p className={`mt-1 mb-5 text-xs ${theme ? "text-slate-500" : "text-slate-400"}`}>
                                            No activities recorded for {formattedMonthName}.
                                        </p>

                                        <button
                                            onClick={() => setActiveTab("create")}
                                            className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all ${theme ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-500"}`}
                                        >
                                            Create First Activity
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <AnimatePresence>
                {selectedGroup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={closeModal}
                        className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md transition-colors duration-300 ${theme ? "bg-slate-950/70" : "bg-slate-900/50"}`}
                        aria-modal="true"
                        role="dialog"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            onClick={(event) => event.stopPropagation()}
                            className={`relative flex flex-col md:flex-row h-[75vh] max-h-155 w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl border ${theme ? "bg-[#151D2F] border-slate-800" : "bg-white border-slate-200"}`}
                        >
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={closeModal}
                                className={`absolute top-4 right-4 z-30 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 shadow-md ${theme ? "bg-slate-800/80 text-slate-300 hover:bg-blue-600 hover:text-white" : "bg-white/90 text-slate-700 hover:bg-red-600 hover:text-white"}`}
                                title="Close"
                            >
                                <X size={18} />
                            </motion.button>

                            <div className="relative flex h-[50%] md:h-full w-full md:w-[70%] items-center justify-center overflow-hidden bg-black/90 p-4 shrink-0">
                                <div
                                    className="absolute inset-0 bg-cover bg-center blur-2xl scale-125 opacity-70 transition-all duration-500"
                                    style={{ backgroundImage: `url(${selectedGroup.images[galleryIndex]?.url})` }}
                                />

                                <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" />

                                <img
                                    src={selectedGroup.images[galleryIndex]?.url}
                                    alt={`${selectedGroup.title} ${galleryIndex + 1}`}
                                    className="relative z-10 max-h-full max-w-full object-contain drop-shadow-2xl transition-all duration-300"
                                />

                                {galleryIndex > 0 && (
                                    <button
                                        onClick={handlePrev}
                                        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-md transition hover:bg-white hover:text-black shadow-lg"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>
                                )}

                                {galleryIndex < selectedGroup.images.length - 1 && (
                                    <button
                                        onClick={handleNext}
                                        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-md transition hover:bg-white hover:text-black shadow-lg"
                                    >
                                        <ChevronRight size={22} />
                                    </button>
                                )}
                            </div>

                            <div className={`flex flex-1 md:w-[30%] flex-col border-t md:border-t-0 md:border-l p-5 sm:p-6 overflow-hidden ${theme ? "border-slate-800 bg-[#0B1120]" : "border-slate-200 bg-slate-50"}`}>
                                <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                                    <h3 className={`text-lg sm:text-xl font-bold pr-8 ${theme ? "text-white" : "text-slate-900"}`}>
                                        {selectedGroup.title}
                                    </h3>

                                    <p className={`mt-1 text-xs font-semibold ${theme ? "text-blue-400" : "text-red-600"}`}>
                                        {selectedGroup.date} • Photo {galleryIndex + 1} of {selectedGroup.images.length}
                                    </p>

                                    <p className={`mt-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${theme ? "text-slate-400" : "text-slate-600"}`}>
                                        {selectedGroup.description || "No description provided."}
                                    </p>
                                </div>

                                <div className={`mt-4 border-t pt-4 ${theme ? "border-slate-800" : "border-slate-200"}`}>
                                    <p className={`mb-2.5 text-[10px] font-bold tracking-wide ${theme ? "text-slate-500" : "text-slate-400"}`}>
                                        All Activity Images ({selectedGroup.images.length})
                                    </p>

                                    <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-36 pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                                        {selectedGroup.images.map((image, index) => (
                                            <button
                                                key={image.id}
                                                onClick={() => setGalleryIndex(index)}
                                                className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${index === galleryIndex
                                                        ? theme
                                                            ? "border-blue-500 scale-95 shadow-md"
                                                            : "border-red-500 scale-95 shadow-md"
                                                        : "border-transparent opacity-70 hover:opacity-100"
                                                    }`}
                                            >
                                                <img
                                                    src={image.url}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Activities;