import { HiX } from "react-icons/hi";
import { useTheme } from "../../../../components/theme/ThemeContext";
import { Modal } from "../../../../components/overlay/OverlayPrimitives";

interface UserDetailsModalProps {
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
}

export default function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
    const { theme } = useTheme();

    return (
        <Modal open={user !== null} onClose={onClose} ariaLabel="User details" className="max-w-2xl p-0">
            {user && (
            <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl ${theme ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-neutral-200 text-neutral-900"}`}>
                <div className={`flex items-center justify-between border-b px-5 py-4 ${theme ? "border-gray-700" : "border-neutral-200"}`}>
                    <div>
                        <h3 className="text-lg font-semibold">User Details</h3>
                        <p className={`text-sm ${theme ? "text-gray-400" : "text-neutral-500"}`}>Full profile overview of {user.name}</p>
                    </div>
                    <button type="button" onClick={onClose} className={`rounded-full p-2 transition ${theme ? "hover:bg-gray-800" : "hover:bg-neutral-100"}`}>
                        <HiX className="text-lg" />
                    </button>
                </div>

                <div className="grid gap-6 p-5 md:grid-cols-[auto_1fr]">
                    <img src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt={user.name} className="h-24 w-24 rounded-full object-cover border-2 border-white/50" />
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className={`text-xs uppercase tracking-wide ${theme ? "text-gray-500" : "text-neutral-400"}`}>Name</p>
                                <p className="font-semibold">{user.name}</p>
                            </div>
                            <div>
                                <p className={`text-xs uppercase tracking-wide ${theme ? "text-gray-500" : "text-neutral-400"}`}>SUID</p>
                                <p className="font-semibold">#{user.suid}</p>
                            </div>
                            <div>
                                <p className={`text-xs uppercase tracking-wide ${theme ? "text-gray-500" : "text-neutral-400"}`}>Role</p>
                                <p className="font-semibold">{user.role}</p>
                            </div>
                            <div>
                                <p className={`text-xs uppercase tracking-wide ${theme ? "text-gray-500" : "text-neutral-400"}`}>Status</p>
                                <p className="font-semibold">{user.status}</p>
                            </div>
                            <div>
                                <p className={`text-xs uppercase tracking-wide ${theme ? "text-gray-500" : "text-neutral-400"}`}>Performance</p>
                                <p className="font-semibold">{user.performance || "AVERAGE"}</p>
                            </div>
                            <div>
                                <p className={`text-xs uppercase tracking-wide ${theme ? "text-gray-500" : "text-neutral-400"}`}>Joined</p>
                                <p className="font-semibold">{user.joiningDate || user.requestDate || "—"}</p>
                            </div>
                        </div>

                        <div>
                            <p className={`mb-2 text-xs uppercase tracking-wide ${theme ? "text-gray-500" : "text-neutral-400"}`}>Permissions</p>
                            {user.permissions && Object.keys(user.permissions).length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(user.permissions).map(([moduleName, actions]) => {
                                        const activeActions = Object.entries(actions).filter(([, allowed]) => allowed).map(([actionName]) => actionName);
                                        return (
                                            <div key={moduleName} className={`rounded-lg border px-3 py-2 ${theme ? "border-gray-700 bg-gray-800" : "border-neutral-200 bg-neutral-50"}`}>
                                                <p className="text-xs font-semibold">{moduleName}</p>
                                                <p className={`text-xs ${theme ? "text-gray-400" : "text-neutral-500"}`}>{activeActions.join(", ") || "No access"}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className={`text-sm ${theme ? "text-gray-400" : "text-neutral-500"}`}>No custom permissions assigned.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            )}
        </Modal>
    );
}
