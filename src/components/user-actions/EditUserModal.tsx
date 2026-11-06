/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { HiX } from "react-icons/hi";
import { useTheme } from "../theme/ThemeContext";
import { Modal } from "../overlay/OverlayPrimitives";

interface EditUserModalProps {
  user: {
    suid: number;
    name: string;
    role: string;
    status: string;
    performance?: string;
    avatar?: string;
    requestDate?: string;
    joiningDate?: string;
    permissions?: Record<string, { create: boolean; edit: boolean; view: boolean; delete: boolean }>;
  } | null;
  onClose: () => void;
  onSave: (updatedUser: any) => Promise<void> | void;
}

export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState(user ? { ...user } : null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(user ? { ...user } : null);
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    onClose();
  };

  return (
    <Modal open={Boolean(user && formData)} onClose={onClose} ariaLabel="Edit user" className="max-w-xl p-0">
      {user && formData && (
      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl ${theme ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-neutral-200 text-neutral-900"}`}>
        <div className={`flex items-center justify-between border-b px-5 py-4 ${theme ? "border-gray-700" : "border-neutral-200"}`}>
          <div>
            <h3 className="text-lg font-semibold">Edit User</h3>
            <p className={`text-sm ${theme ? "text-gray-400" : "text-neutral-500"}`}>Update user details</p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-full p-2 transition ${theme ? "hover:bg-gray-800" : "hover:bg-neutral-100"}`}>
            <HiX className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>Name</span>
              <input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`} />
            </label>
            <label className="space-y-1">
              <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>Role</span>
              <input value={formData.role} onChange={(e) => handleChange("role", e.target.value)} required className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`} />
            </label>
            <label className="space-y-1">
              <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>Status</span>
              <select value={formData.status} onChange={(e) => handleChange("status", e.target.value)} className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`}>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className={`text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-600"}`}>Performance</span>
              <input value={formData.performance || "AVERAGE"} onChange={(e) => handleChange("performance", e.target.value)} className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`} />
            </label>
          </div>

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
      )}
    </Modal>
  );
}
