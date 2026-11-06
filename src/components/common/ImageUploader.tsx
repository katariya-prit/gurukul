import React, { useEffect, useState, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Check, ImagePlus, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { uploadService } from "../../services/uploadService";
import { Modal } from "../overlay/OverlayPrimitives";

interface ImageUploaderProps {
    value?: string | null;
    onChange: (url: string) => void;
    theme: boolean;
    uploadType?: "avatar" | "section";
    shape?: "circle" | "square";
    size?: number;
    label?: string;
}

const createCroppedFile = async (imageSrc: string, cropArea: Area) => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = reject;
        element.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Could not prepare the image for upload.");

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    context.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
    );

    return new Promise<File>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Could not prepare the image for upload."));
                return;
            }
            resolve(new File([blob], "cropped-image.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.92);
    });
};

export default function ImageUploader({
    value,
    onChange,
    theme,
    uploadType = "avatar",
    shape = "circle",
    size = 128,
    label,
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [editingImage, setEditingImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => () => {
        if (editingImage) URL.revokeObjectURL(editingImage);
    }, [editingImage]);

    const doUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files (jpg, png, webp) are allowed.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be less than 10MB.");
            return;
        }

        try {
            setUploading(true);
            const url =
                uploadType === "avatar"
                    ? await uploadService.uploadAvatar(file)
                    : await uploadService.uploadSectionImage(file);

            onChange(url);
            toast.success("Image uploaded successfully");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const startEditing = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files (jpg, png, webp) are allowed.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be less than 10MB.");
            return;
        }
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setEditingImage(URL.createObjectURL(file));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) startEditing(file);
        e.target.value = "";
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) startEditing(file);
    };

    const closeEditor = () => {
        setEditingImage(null);
        setCroppedAreaPixels(null);
    };

    const confirmCrop = async () => {
        if (!editingImage || !croppedAreaPixels) return;
        try {
            const croppedFile = await createCroppedFile(editingImage, croppedAreaPixels);
            closeEditor();
            await doUpload(croppedFile);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to edit image");
        }
    };

    const roundedClass = shape === "circle" ? "rounded-full" : "rounded-3xl";
    const zoomPercent = ((zoom - 1) / 2) * 100;
    const iconBtnClass = `p-2 rounded-full transition-all active:scale-95 ${theme ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"
        }`;

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ width: size, height: size }}
                className={`
                    relative group ${roundedClass} overflow-hidden 
                    flex items-center justify-center cursor-pointer 
                    transition-all duration-500 ease-out border
                    ${isDragging
                        ? (theme
                            ? "border-blue-500/50 bg-blue-900/20 scale-105 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-4 ring-blue-500/20"
                            : "border-red-400/50 bg-red-50 scale-105 shadow-[0_0_30px_rgba(239,68,68,0.15)] ring-4 ring-red-500/20")
                        : (theme
                            ? "border-slate-700/50 bg-linear-to-br from-slate-800 to-slate-900 hover:border-slate-600 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                            : "border-slate-200/80 bg-linear-to-br from-white to-slate-50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-300")
                    }
                `}
            >
                {value ? (
                    <img
                        src={value}
                        alt="Uploaded"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className={`flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-110 ${theme ? "text-slate-400" : "text-slate-400"}`}>
                        <ImagePlus size={size > 80 ? 32 : 20} strokeWidth={1.5} />
                    </div>
                )}

                {!uploading && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                        <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500 flex flex-col items-center">
                            <Camera size={size > 80 ? 26 : 16} className="text-white/90" strokeWidth={1.5} />
                            {size > 80 && <span className="text-white/90 text-[10px] font-medium tracking-widest mt-2 uppercase">Upload</span>}
                        </div>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
                        <Loader2 className="text-white/90 animate-spin" size={size > 80 ? 28 : 18} strokeWidth={2} />
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                />
            </div>

            {label && (
                <span className={`text-[13px] tracking-wide font-medium transition-colors ${theme ? "text-slate-400" : "text-slate-500"}`}>
                    {uploading ? "Uploading..." : label}
                </span>
            )}

            <Modal open={editingImage !== null} onClose={closeEditor} ariaLabel="Edit image" className="max-w-2xl p-0">
                {editingImage && (
                    <div
                        className={`pointer-events-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border transition-all ${theme
                                ? "border-slate-800/60 bg-slate-900 text-slate-100 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                                : "border-slate-200/60 bg-white/95 backdrop-blur-xl text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.1)]"
                            }`}
                    >
                        <div className={`flex items-center justify-between border-b px-6 py-4 ${theme ? "border-slate-800/50" : "border-slate-200/50"}`}>
                            <div>
                                <h2 className="text-base font-semibold tracking-wide">Edit Profile Photo</h2>
                                <p className={`text-xs mt-0.5 ${theme ? "text-slate-400" : "text-slate-500"}`}>Position and zoom your image to perfection</p>
                            </div>
                            <button type="button" onClick={closeEditor} className={`rounded-full p-2.5 transition-colors ${theme ? "hover:bg-slate-800/80" : "hover:bg-slate-100"}`} aria-label="Close image editor">
                                <X size={18} strokeWidth={2} />
                            </button>
                        </div>

                        <div className={`relative h-[min(28rem,60dvh)] min-h-64 w-full shrink-0 ${theme ? "bg-slate-950/50" : "bg-slate-50"}`}>
                            <Cropper
                                image={editingImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape={shape === "circle" ? "round" : "rect"}
                                showGrid={true}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                            />
                        </div>

                        <div className="space-y-5 px-6 py-5">
                            {/* 1. Zoom Slider with Line Progress */}
                            <div className="flex items-center gap-4">
                                <button type="button" onClick={() => setZoom(Math.max(1, zoom - 0.1))} className={iconBtnClass} aria-label="Zoom out">
                                    <ZoomOut size={18} />
                                </button>
                                <input
                                    aria-label="Zoom"
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.01}
                                    value={zoom}
                                    onChange={(event) => setZoom(Number(event.target.value))}
                                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer outline-none transition-all duration-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
                                    style={{
                                        background: `linear-gradient(to right, ${theme ? '#3b82f6' : '#ef4444'} ${zoomPercent}%, ${theme ? '#334155' : '#e2e8f0'} ${zoomPercent}%)`
                                    }}
                                />
                                <button type="button" onClick={() => setZoom(Math.min(3, zoom + 0.1))} className={iconBtnClass} aria-label="Zoom in">
                                    <ZoomIn size={18} />
                                </button>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-700/20">
                                <button type="button" onClick={closeEditor} className={`rounded-xl px-5 py-2 text-sm font-medium transition-all ${theme ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}>
                                    Cancel
                                </button>
                                <button type="button" onClick={confirmCrop} className={`flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 ${theme ? "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25" : "bg-red-500 hover:bg-red-600 hover:shadow-red-500/25"}`}>
                                    <Check size={18} strokeWidth={2.5} /> Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}