
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiPlus, HiX } from "react-icons/hi";
import { toast } from "sonner";
import { useTheme } from "../../../components/theme/ThemeContext";
import ImageCropEditor from "../../../components/common/ImageCropEditor";
import { API_BASE_URL } from "../../../services/OverviewService";

const SECTION = "heroSlider";

interface OverviewImageItem {
    localKey: string;
    id: number | null;
    url: string | null;
    title: string;
    description: string;
    file?: File;
    saving?: boolean;
    uploading?: boolean;
}

interface OverviewApiResult {
    success: boolean;
    message?: string;
    data?: any;
}

function Reveal({
    children,
    delay = 0,
}: {
    children: React.ReactNode;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("token");

    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
};

async function apiRequest(
    url: string,
    options: RequestInit = {}
): Promise<{ response: Response; result: OverviewApiResult }> {
    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Login token not found. Please login again.");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const result = await response.json().catch(() => ({
        success: false,
        message: "Invalid server response",
    }));

    if (response.status === 401) {
        throw new Error("Session expired or token is invalid. Please login again.");
    }

    if (!response.ok || !result.success) {
        throw new Error(result.message || `Request failed (${response.status})`);
    }

    return { response, result };
}

async function optimizeImage(file: File): Promise<File> {
    const image = await createImageBitmap(file);
    const maxDimension = 1600;
    const scale = Math.min(
        1,
        maxDimension / Math.max(image.width, image.height)
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d");

    if (!context) {
        image.close();
        throw new Error("Unable to process image");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.82);
    });

    if (!blob) {
        throw new Error("Unable to optimize image");
    }

    return new File(
        [blob],
        `${file.name.replace(/\.[^/.]+$/, "")}.webp`,
        { type: "image/webp" }
    );
}

export default function OverviewManagement() {
    const { theme } = useTheme();

    const [images, setImages] = useState<OverviewImageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggingKey, setDraggingKey] = useState<string | null>(null);
    const [cropTarget, setCropTarget] = useState<{
        localKey: string;
        file: File;
    } | null>(null);
    const [isCropEditorOpen, setIsCropEditorOpen] = useState(false);

    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const changeInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        void fetchOverviewImages();
    }, []);

    useEffect(() => {
        return () => {
            images.forEach((item) => {
                if (item.url?.startsWith("blob:")) {
                    URL.revokeObjectURL(item.url);
                }
            });
        };
    }, [images]);

    const fetchOverviewImages = async () => {
        try {
            setLoading(true);

            const { result } = await apiRequest(
                `${API_BASE_URL}/overview`,
                { method: "GET" }
            );

            const sectionImages = result.data?.[SECTION];

            if (Array.isArray(sectionImages)) {
                const mapped: OverviewImageItem[] = sectionImages.map(
                    (img: {
                        id: number;
                        url: string;
                        title?: string;
                        description?: string;
                    }) => ({
                        localKey: `db-${img.id}`,
                        id: img.id,
                        url: img.url,
                        title: img.title || "",
                        description: img.description || "",
                    })
                );

                setImages(mapped);
            } else {
                setImages([]);
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to load overview images"
            );
        } finally {
            setLoading(false);
        }
    };

    const addNewSlot = () => {
        const newItem: OverviewImageItem = {
            localKey: `new-${Date.now()}-${Math.random()}`,
            id: null,
            url: null,
            title: "",
            description: "",
        };

        setImages((prev) => [...prev, newItem]);
    };

    const handleCroppedImage = async (croppedFile: File) => {
        if (!cropTarget) return;

        const targetKey = cropTarget.localKey;

        try {
            const optimizedFile = await optimizeImage(croppedFile);
            const previewUrl = URL.createObjectURL(optimizedFile);

            setImages((prev) =>
                prev.map((img) => {
                    if (img.localKey !== targetKey) return img;

                    if (img.url?.startsWith("blob:")) {
                        URL.revokeObjectURL(img.url);
                    }

                    return {
                        ...img,
                        file: optimizedFile,
                        url: previewUrl,
                        uploading: false,
                    };
                })
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to process image"
            );

            setImages((prev) =>
                prev.map((img) =>
                    img.localKey === targetKey
                        ? { ...img, uploading: false }
                        : img
                )
            );
        } finally {
            setCropTarget(null);
            setIsCropEditorOpen(false);
        }
    };

    const handleFileUpload = (localKey: string, file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed.");
            return;
        }

        setImages((prev) =>
            prev.map((img) =>
                img.localKey === localKey
                    ? { ...img, uploading: true }
                    : img
            )
        );

        setCropTarget({ localKey, file });
        setIsCropEditorOpen(true);
    };

    const handleChangeImage = (
        item: OverviewImageItem,
        file: File
    ) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed.");
            return;
        }

        setImages((prev) =>
            prev.map((img) =>
                img.localKey === item.localKey
                    ? { ...img, uploading: true }
                    : img
            )
        );

        setCropTarget({ localKey: item.localKey, file });
        setIsCropEditorOpen(true);
    };

    const handleSave = async (item: OverviewImageItem) => {
        if (!item.title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (!item.url) {
            toast.error("Please select an image first");
            return;
        }

        setImages((prev) =>
            prev.map((img) =>
                img.localKey === item.localKey
                    ? { ...img, saving: true }
                    : img
            )
        );

        try {
            let result: OverviewApiResult;

            if (item.file) {
                const formData = new FormData();
                formData.append("image", item.file);
                formData.append("section", SECTION);
                formData.append("title", item.title.trim());
                formData.append("description", item.description.trim());

                const response = await fetch(
                    `${API_BASE_URL}/overview/update`,
                    {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: formData,
                    }
                );

                result = await response.json().catch(() => ({
                    success: false,
                    message: "Invalid server response",
                }));

                if (response.status === 401) {
                    throw new Error(
                        "Session expired or token is invalid. Please login again."
                    );
                }

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || `Save failed (${response.status})`
                    );
                }
            } else if (item.id) {
                const { result: updateResult } = await apiRequest(
                    `${API_BASE_URL}/overview/${item.id}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            title: item.title.trim(),
                            description: item.description.trim(),
                        }),
                    }
                );

                result = updateResult;
            } else {
                throw new Error("Please select an image first");
            }

            if (
                item.file &&
                item.id &&
                result.data?.id &&
                result.data.id !== item.id
            ) {
                await apiRequest(
                    `${API_BASE_URL}/overview/${item.id}`,
                    { method: "DELETE" }
                );
            }

            setImages((prev) =>
                prev.map((img) =>
                    img.localKey === item.localKey
                        ? {
                            ...img,
                            id: result.data?.id ?? img.id,
                            url: result.data?.url ?? img.url,
                            title: result.data?.title ?? item.title.trim(),
                            description:
                                result.data?.description ??
                                item.description.trim(),
                            file: undefined,
                            saving: false,
                        }
                        : img
                )
            );

            toast.success("Overview content saved");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to save overview content"
            );

            setImages((prev) =>
                prev.map((img) =>
                    img.localKey === item.localKey
                        ? { ...img, saving: false }
                        : img
                )
            );
        }
    };

    const handleRemoveItem = async (
        item: OverviewImageItem,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();

        if (item.id) {
            try {
                await apiRequest(
                    `${API_BASE_URL}/overview/${item.id}`,
                    { method: "DELETE" }
                );

                toast.success("Image removed");
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to delete image"
                );
                return;
            }
        }

        if (item.url?.startsWith("blob:")) {
            URL.revokeObjectURL(item.url);
        }

        setImages((prev) =>
            prev.filter((img) => img.localKey !== item.localKey)
        );
    };

    const onDragOver = (
        e: React.DragEvent,
        localKey: string
    ) => {
        e.preventDefault();
        setDraggingKey(localKey);
    };

    const onDragLeave = () => {
        setDraggingKey(null);
    };

    const onDrop = (
        e: React.DragEvent,
        item: OverviewImageItem
    ) => {
        e.preventDefault();
        setDraggingKey(null);

        const file = e.dataTransfer.files?.[0];

        if (!file) return;

        if (item.url) {
            handleChangeImage(item, file);
        } else {
            handleFileUpload(item.localKey, file);
        }
    };

    return (
        <div
            className={`w-full min-h-screen p-6 sm:p-10 lg:p-12 font-sans transition-colors duration-500 ${theme
                    ? "bg-slate-950 text-slate-100"
                    : "bg-slate-50 text-slate-800"
                }`}
        >
            <Reveal>
                <div className="text-center mb-14 relative">
                    {theme && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 blur-[70px] rounded-full pointer-events-none" />
                    )}

                    <h1 className="relative z-10 text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 transition-all duration-500">
                        <span
                            className={`bg-clip-text text-transparent ${theme
                                    ? "bg-linear-to-r from-white via-slate-200 to-slate-400"
                                    : "bg-linear-to-r from-slate-900 via-slate-700 to-slate-500"
                                }`}
                        >
                            Overview{" "}
                        </span>
                        <span
                            className={`bg-clip-text text-transparent ${theme
                                    ? "bg-linear-to-r from-blue-400 to-indigo-400"
                                    : "bg-linear-to-r from-red-600 to-rose-500"
                                }`}
                        >
                            Management
                        </span>
                    </h1>

                    <p
                        className={`relative z-10 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed ${theme ? "text-slate-400" : "text-slate-500"
                            }`}
                    >
                        Curate and manage your featured section images with precision.
                    </p>
                </div>
            </Reveal>

            <div className="max-w-7xl mx-auto flex justify-end mb-6">
                <button
                    type="button"
                    onClick={addNewSlot}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-95 ${theme
                            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30"
                            : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                        }`}
                >
                    <HiPlus size={18} />
                    Add Image
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div
                        className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${theme ? "border-blue-500" : "border-rose-600"
                            }`}
                    />
                </div>
            ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {images.map((item, index) => (
                            <motion.div
                                key={item.localKey}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Reveal delay={index * 0.05}>
                                    <motion.div
                                        whileHover={{ y: -6, scale: 1.005 }}
                                        transition={{
                                            duration: 0.3,
                                            ease: "easeOut",
                                        }}
                                        className={`relative w-full ${!item.url ? "max-w-md mx-auto" : ""
                                            } rounded-3xl overflow-hidden backdrop-blur-md transition-all duration-500 group flex flex-col ${item.url
                                                ? theme
                                                    ? "bg-slate-900/80 border border-slate-700/80 hover:border-blue-400/80 shadow-lg"
                                                    : "bg-white border border-slate-200 hover:border-rose-400/80 shadow-lg"
                                                : draggingKey === item.localKey
                                                    ? theme
                                                        ? "bg-blue-950/40 border-2 border-dashed border-blue-400"
                                                        : "bg-rose-50/60 border-2 border-dashed border-rose-500"
                                                    : theme
                                                        ? "bg-slate-900/40 border-2 border-dashed border-slate-700/70 hover:border-blue-400/80"
                                                        : "bg-white/80 border-2 border-dashed border-slate-300 hover:border-rose-400/90"
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-0 left-0 right-0 h-0.5 z-10 ${theme
                                                    ? "bg-linear-to-r from-transparent via-blue-500/60 to-transparent"
                                                    : "bg-linear-to-r from-transparent via-rose-500/50 to-transparent"
                                                }`}
                                        />

                                        <button
                                            type="button"
                                            onClick={(e) =>
                                                void handleRemoveItem(item, e)
                                            }
                                            className={`absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md border shadow-lg transition-all hover:scale-110 ${theme
                                                    ? "bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-blue-500 hover:text-white"
                                                    : "bg-white/90 border-slate-200 text-slate-600 hover:bg-red-500 hover:text-white"
                                                }`}
                                            title="Remove"
                                        >
                                            <HiX size={16} />
                                        </button>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={(el) => {
                                                fileInputRefs.current[item.localKey] = el;
                                            }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleFileUpload(item.localKey, file);
                                                }
                                                e.target.value = "";
                                            }}
                                        />

                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={(el) => {
                                                changeInputRefs.current[item.localKey] = el;
                                            }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleChangeImage(item, file);
                                                }
                                                e.target.value = "";
                                            }}
                                        />

                                        <div
                                            onClick={() => {
                                                if (item.uploading) return;

                                                if (item.url) {
                                                    changeInputRefs.current[
                                                        item.localKey
                                                    ]?.click();
                                                } else {
                                                    fileInputRefs.current[
                                                        item.localKey
                                                    ]?.click();
                                                }
                                            }}
                                            onDragOver={(e) =>
                                                onDragOver(e, item.localKey)
                                            }
                                            onDragLeave={onDragLeave}
                                            onDrop={(e) => onDrop(e, item)}
                                            className={`relative w-full ${item.url
                                                    ? "h-80 sm:h-96"
                                                    : "h-48 sm:h-56"
                                                } shrink-0 overflow-hidden cursor-pointer flex items-center justify-center`}
                                        >
                                            {item.uploading ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${theme
                                                                ? "border-blue-500"
                                                                : "border-rose-600"
                                                            }`}
                                                    />
                                                    <span className="text-xs font-bold">
                                                        Processing...
                                                    </span>
                                                </div>
                                            ) : item.url ? (
                                                <>
                                                    <img
                                                        src={item.url}
                                                        alt={`Overview Image ${index + 1}`}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />

                                                    <div
                                                        className={`absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${theme
                                                                ? "bg-slate-900/80 text-blue-400 border-slate-700"
                                                                : "bg-white/90 text-rose-600 border-slate-200"
                                                            }`}
                                                    >
                                                        Slot {String(index + 1).padStart(2, "0")}
                                                    </div>

                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center p-6">
                                                        <span className="px-5 py-2.5 rounded-full font-bold text-xs bg-white/90 text-slate-800">
                                                            Change Image
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-8 text-center select-none">
                                                    <div
                                                        className={`w-16 h-16 mb-5 rounded-2xl flex items-center justify-center border shadow-lg ${theme
                                                                ? "bg-slate-800/60 border-slate-700 text-blue-400"
                                                                : "bg-slate-100 border-slate-200 text-rose-500"
                                                            }`}
                                                    >
                                                        <svg
                                                            className="w-8 h-8 stroke-current"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.8}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                                                            />
                                                        </svg>
                                                    </div>

                                                    <span
                                                        className={`text-xs font-bold tracking-wider uppercase mb-1 ${theme
                                                                ? "text-blue-400"
                                                                : "text-rose-600"
                                                            }`}
                                                    >
                                                        Image
                                                    </span>

                                                    <h3 className="text-lg font-bold">
                                                        Upload Overview Image
                                                    </h3>

                                                    <p className="text-xs mt-2 max-w-50">
                                                        Drag and drop an image here or click to browse
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className={`w-full p-5 sm:p-6 text-left ${theme
                                                    ? "bg-slate-900/95"
                                                    : "bg-white"
                                                }`}
                                        >
                                            <label className="block text-xs font-bold mb-1">
                                                Title
                                            </label>

                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(e) =>
                                                    setImages((prev) =>
                                                        prev.map((img) =>
                                                            img.localKey === item.localKey
                                                                ? {
                                                                    ...img,
                                                                    title: e.target.value,
                                                                }
                                                                : img
                                                        )
                                                    )
                                                }
                                                placeholder="Enter image title"
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${theme
                                                        ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-400"
                                                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-rose-400"
                                                    }`}
                                            />

                                            <label className="block text-xs font-bold mt-4 mb-1">
                                                Description
                                            </label>

                                            <textarea
                                                value={item.description}
                                                onChange={(e) =>
                                                    setImages((prev) =>
                                                        prev.map((img) =>
                                                            img.localKey === item.localKey
                                                                ? {
                                                                    ...img,
                                                                    description: e.target.value,
                                                                }
                                                                : img
                                                        )
                                                    )
                                                }
                                                placeholder="Enter image description"
                                                rows={3}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none ${theme
                                                        ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-400"
                                                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-rose-400"
                                                    }`}
                                            />
                                        </div>

                                        <div
                                            className={`w-full px-5 sm:px-6 pb-5 sm:pb-6 pt-1 ${theme
                                                    ? "bg-slate-900/95"
                                                    : "bg-white"
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => void handleSave(item)}
                                                disabled={
                                                    item.saving ||
                                                    item.uploading ||
                                                    !item.url
                                                }
                                                className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${theme
                                                        ? "bg-blue-600 hover:bg-blue-500"
                                                        : "bg-rose-600 hover:bg-rose-500"
                                                    }`}
                                            >
                                                {item.saving ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    </motion.div>
                                </Reveal>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {!loading && images.length === 0 && (
                <p
                    className={`text-center mt-10 ${theme ? "text-slate-500" : "text-slate-400"
                        }`}
                >
                    No images yet — click "Add Image" to upload your first overview image.
                </p>
            )}

            <ImageCropEditor
                file={cropTarget?.file ?? null}
                isOpen={isCropEditorOpen}
                theme={theme}
                shape="square"
                title="Edit Overview Image"
                subtitle="Frame the image exactly as it should appear in the overview gallery"
                onClose={() => {
                    setCropTarget(null);
                    setIsCropEditorOpen(false);
                    setImages((prev) =>
                        prev.map((img) =>
                            img.localKey === cropTarget?.localKey
                                ? { ...img, uploading: false }
                                : img
                        )
                    );
                }}
                onCropped={handleCroppedImage}
            />
        </div>
    );
}
