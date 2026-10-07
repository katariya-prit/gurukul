import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../../components/theme/ThemeContext";
import { HiOutlineSun, HiOutlineTrash, HiOutlinePhotograph, HiOutlinePencil } from "react-icons/hi";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

interface DarshanEntry {
    id: number;
    title: string;
    imageUrl: string;
    description: string;
    date: string;
}

export default function AdminDailyDarshan() {
    const { theme } = useTheme();

    const [entries, setEntries] = useState<DarshanEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchEntries = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/daily-darshan`, { cache: "no-store" });
            const result = await res.json();
            if (result.success) setEntries(result.data);
        } catch (err) {
            toast.error("Failed to load darshan entries");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDate(new Date().toISOString().split("T")[0]);
        setImageFile(null);
        setPreviewUrl(null);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!imageFile && !editingId) {
            toast.error("Please select an image");
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("date", date);
            if (imageFile) formData.append("image", imageFile);

            const res = await fetch(editingId ? `${API_URL}/daily-darshan/${editingId}` : `${API_URL}/daily-darshan`, {
                method: editingId ? "PUT" : "POST",
                body: formData,
            });
            const result = await res.json();

            if (result.success) {
                toast.success(editingId ? "Daily Darshan updated!" : "Daily Darshan added!");
                resetForm();
                fetchEntries();
            } else {
                toast.error(result.message || "Failed to add entry");
            }
        } catch (err) {
            toast.error("Something went wrong while uploading");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (entry: DarshanEntry) => {
        setEditingId(entry.id);
        setTitle(entry.title);
        setDescription(entry.description);
        setDate(entry.date);
        setPreviewUrl(entry.imageUrl);
        setImageFile(null);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this darshan entry?")) return;
        try {
            const res = await fetch(`${API_URL}/daily-darshan/${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                toast.success("Deleted");
                setEntries((prev) => prev.filter((e) => e.id !== id));
            } else {
                toast.error(result.message || "Failed to delete");
            }
        } catch (err) {
            toast.error("Something went wrong while deleting");
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center w-11 h-11 rounded-xl ${theme ? "bg-blue-500/10 text-blue-300" : "bg-[#9b001c]/10 text-[#9b001c]"}`}>
                    <HiOutlineSun size={21} />
                </span>
                <div>
                    <h1 className={`text-xl font-bold ${theme ? "text-white" : "text-gray-900"}`}>Daily Darshan Management</h1>
                    <p className={`text-xs mt-0.5 ${theme ? "text-gray-500" : "text-gray-400"}`}>Upload today's divine darshan</p>
                </div>
            </div>

            {/* Upload Form */}
            <form
                onSubmit={handleSubmit}
                className={`rounded-2xl border p-6 space-y-4 ${theme ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`text-xs font-bold uppercase tracking-wide ${theme ? "text-gray-400" : "text-gray-500"}`}>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Shree Swaminarayan Bhagwan"
                            className={`mt-1.5 w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                                theme
                                    ? "bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                                    : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#9b001c]"
                            }`}
                        />
                    </div>
                    <div>
                        <label className={`text-xs font-bold uppercase tracking-wide ${theme ? "text-gray-400" : "text-gray-500"}`}>Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={`mt-1.5 w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                                theme
                                    ? "bg-gray-800/60 border-gray-700 text-white focus:border-blue-500"
                                    : "bg-white border-gray-200 text-gray-800 focus:border-[#9b001c]"
                            }`}
                        />
                    </div>
                </div>

                <div>
                    <label className={`text-xs font-bold uppercase tracking-wide ${theme ? "text-gray-400" : "text-gray-500"}`}>Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Today's divine darshan description..."
                        className={`mt-1.5 w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none transition-colors ${
                            theme
                                ? "bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                                : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#9b001c]"
                        }`}
                    />
                </div>

                <div>
                    <label className={`text-xs font-bold uppercase tracking-wide ${theme ? "text-gray-400" : "text-gray-500"}`}>Image</label>
                    <div className="mt-1.5 flex items-center gap-4">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-gray-700" />
                        ) : (
                            <div className={`w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center ${theme ? "border-gray-700 text-gray-600" : "border-gray-200 text-gray-300"}`}>
                                <HiOutlinePhotograph size={28} />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className={`text-sm ${theme ? "text-gray-300" : "text-gray-600"}`}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-50 ${
                        theme ? "bg-blue-600 hover:bg-blue-500" : "bg-[#9b001c] hover:bg-[#7a0016]"
                    }`}
                >
                    {submitting ? (editingId ? "Updating..." : "Uploading...") : (editingId ? "Update Darshan" : "Upload Darshan")}
                </button>
            </form>

            {/* Existing Entries List */}
            <div className={`rounded-2xl border overflow-hidden ${theme ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
                <h3 className={`text-sm font-bold px-5 pt-5 ${theme ? "text-gray-200" : "text-gray-800"}`}>All Darshan Entries</h3>

                {loading ? (
                    <div className="p-5 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={`h-16 rounded-xl animate-pulse ${theme ? "bg-gray-800/60" : "bg-gray-100"}`} />
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <p className={`text-sm py-10 text-center ${theme ? "text-gray-600" : "text-gray-400"}`}>No darshan entries uploaded yet</p>
                ) : (
                    <ul className={`divide-y mt-3 ${theme ? "divide-gray-800" : "divide-gray-100"}`}>
                        {entries.map((entry) => (
                            <li key={entry.id} className="flex items-center gap-4 px-5 py-3.5">
                                <img
                                    src={entry.imageUrl}
                                    alt={entry.title}
                                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${theme ? "text-gray-200" : "text-gray-800"}`}>{entry.title}</p>
                                    <p className={`text-xs mt-0.5 ${theme ? "text-gray-500" : "text-gray-400"}`}>{entry.date}</p>
                                </div>
                                <button
                                    onClick={() => handleEdit(entry)}
                                    className={`p-2 rounded-lg transition-colors ${theme ? "text-blue-400 hover:bg-blue-500/10" : "text-blue-600 hover:bg-blue-50"}`}
                                    title="Edit"
                                >
                                    <HiOutlinePencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className={`p-2 rounded-lg transition-colors ${theme ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}
                                    title="Delete"
                                >
                                    <HiOutlineTrash size={18} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}