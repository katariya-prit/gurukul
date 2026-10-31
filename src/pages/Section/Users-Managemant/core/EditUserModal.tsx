import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HiX } from "react-icons/hi";
import { useTheme } from "../../../../components/theme/ThemeContext";

export interface EditUserModalData {
  suid: number;
  name: string;
  username: string;
  roleCode: string;
  bod: string;
  joiningDate: string;
  password?: string;
}

interface EditUserModalProps {
  user: EditUserModalData | null;
  onClose: () => void;
  onSave: (updatedUser: EditUserModalData) => Promise<void> | void;
}

const getCurrentUser = (): { roleCode?: string } | null => {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<EditUserModalData | null>(user ? { ...user } : null);
  const [newUserId, setNewUserId] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const currentUser = getCurrentUser();
  const isSuperAdmin = currentUser?.roleCode === "SUPER_ADMIN";

  useEffect(() => {
    setFormData(user ? { ...user } : null);
    setNewUserId(user ? String(user.suid) : "");
    setNewPassword("");
  }, [user]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!user || !formData) return null;

  const handleChange = (field: keyof EditUserModalData, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: EditUserModalData = { ...formData };

      if (isSuperAdmin) {
        const parsedUserId = Number(newUserId);
        // 🔴 FIX: sirf tyare j suid payload ma mokalo jyare khareker badlayu hoy
        if (parsedUserId && parsedUserId !== user.suid) {
          payload.suid = parsedUserId;
        }
        if (newPassword.trim().length > 0) {
          payload.password = newPassword.trim();
        }
      }

      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 px-4">
      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl ${theme ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-neutral-200 text-neutral-900"}`}>
        <div className={`flex items-center justify-between border-b px-5 py-4 ${theme ? "border-gray-700" : "border-neutral-200"}`}>
          <div>
            <h3 className="text-lg font-semibold">Edit User</h3>
            <p className={`text-sm ${theme ? "text-gray-400" : "text-neutral-500"}`}>
              Updating <span className="font-semibold">#{formData.suid}</span> — {formData.name}
            </p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-full p-2 transition ${theme ? "hover:bg-gray-800" : "hover:bg-neutral-100"}`}>
            <HiX className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 max-h-[75vh] overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>Full Name</span>
              <input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`}
              />
            </label>

            <label className="space-y-1">
              <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>Username</span>
              <input
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                required
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`}
              />
            </label>

            <label className="space-y-1">
              <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>Role Code</span>
              <input
                value={formData.roleCode}
                onChange={(e) => handleChange("roleCode", e.target.value)}
                required
                placeholder="e.g. HEAD100, STUDENT"
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`}
              />
            </label>

            <label className="space-y-1">
              <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>Joining Date</span>
              <input
                type="date"
                value={formData.joiningDate?.slice(0, 10) || ""}
                onChange={(e) => handleChange("joiningDate", e.target.value)}
                required
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`}
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>Date of Birth (BOD)</span>
              <input
                type="date"
                value={formData.bod?.slice(0, 10) || ""}
                onChange={(e) => handleChange("bod", e.target.value)}
                required
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`}
              />
            </label>
          </div>

          {isSuperAdmin ? (
            <div className={`space-y-3 rounded-xl border p-3.5 ${theme ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
              <p className={`text-xs font-bold uppercase tracking-wide ${theme ? "text-amber-400" : "text-amber-700"}`}>
                Super Admin Only — Sensitive Fields
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>User ID (SUID)</span>
                  <input
                    type="number"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`}
                  />
                </label>
                <label className="space-y-1">
                  <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>New Password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`}
                  />
                </label>
              </div>
            </div>
          ) : (
            <p className={`text-xs rounded-lg border px-3 py-2 ${theme ? "border-gray-700 bg-gray-800/50 text-gray-500" : "border-neutral-200 bg-neutral-50 text-neutral-400"}`}>
              User ID અને Password ફક્ત SUPER_ADMIN જ બદલી શકે છે.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className={`rounded-xl px-4 py-2 text-sm font-semibold ${theme ? "bg-gray-800 hover:bg-gray-700" : "bg-neutral-100 hover:bg-neutral-200"}`}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#9b001c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7f0017] disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}