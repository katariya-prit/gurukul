import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../theme/ThemeContext';
import { notificationService, type NotificationItem } from '../../services/notificationService';
import { useNotificationStream } from '../../hooks/useNotificationStream';
import { toast } from 'sonner';

interface NotificationBoxProps {
    isOpen: boolean;
    onClose: () => void;
}

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const NotificationBox: React.FC<NotificationBoxProps> = ({ isOpen, onClose }) => {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const user = (() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    })();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const result = await notificationService.getAll();
            if (result.success) {
                setNotifications(result.data);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchNotifications();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useNotificationStream(user?.roleCode, (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        toast.info(newNotification.title);
    });

    const handleApprove = async (notif: NotificationItem) => {
        if (!notif.relatedId) return;
        setProcessingId(notif.id);
        try {
            const res = await fetch(`${API_URL}/users/approve/${notif.relatedId}`, {
                method: "PUT",
                headers: getAuthHeaders(),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to approve user.");
            }

            await notificationService.markRead(notif.id);
            setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
            toast.success("User approved successfully.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to approve user.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (notif: NotificationItem) => {
        if (!notif.relatedId) return;
        const confirmed = window.confirm("Are you sure you want to deny and remove this user?");
        if (!confirmed) return;

        setProcessingId(notif.id);
        try {
            const res = await fetch(`${API_URL}/users/delete/${notif.relatedId}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to deny user.");
            }

            await notificationService.markRead(notif.id);
            setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
            toast.success("User denied and removed.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to deny user.");
        } finally {
            setProcessingId(null);
        }
    };

    if (!isOpen || !mounted) return null;

    const renderIcon = (type: string) => {
        if (type === 'PERMISSION_REQUEST') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
            );
        }
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        );
    };

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin} mins ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} hr ago`;
        return date.toLocaleDateString();
    };

    const isDark = theme;

    const portalContent = (
        <>
            <style>{`
        @keyframes customFadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes customScaleDown {
          from { transform: scale(1.05); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-lux-fade { animation: customFadeIn 0.3s ease-out forwards; }
        .animate-lux-scale { animation: customScaleDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

            <div
                className={`fixed inset-0 z-99999 flex justify-center items-start pt-21.25 animate-lux-fade ${isDark ? 'bg-slate-900/70' : 'bg-red-100/65'
                    }`}
                onClick={onClose}
            >
                <div
                    className={`w-200 rounded-[20px] p-6 animate-lux-scale backdrop-blur-xl border ${isDark
                        ? 'bg-linear-to-br from-slate-800/98 to-slate-900/99 border-slate-500/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9),0_0_20px_rgba(0,0,0,0.3)]'
                        : 'bg-linear-to-br from-white/98 to-slate-50/95 border-red-300/60 shadow-[0_25px_50px_-12px_rgba(220,38,38,0.15),0_0_15px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,1)]'
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`flex justify-between items-center mb-5 border-b pb-4 ${isDark ? 'border-slate-600/40' : 'border-red-500/10'}`}>
                        <h3 className={`m-0 text-[1.15rem] font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            Notifications
                        </h3>
                        <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <button
                                className={`h-8 w-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border-none ${isDark
                                    ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-50 hover:rotate-90'
                                    : 'bg-red-500/5 text-slate-600 hover:bg-red-100 hover:text-red-500 hover:rotate-90'
                                    }`}
                                onClick={onClose}
                                title="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 max-h-100 overflow-y-auto">
                        {loading ? (
                            <p className={`text-center py-8 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Loading notifications...
                            </p>
                        ) : notifications.length === 0 ? (
                            <p className={`text-center py-8 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                No notifications yet
                            </p>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`flex items-start gap-4 p-3.5 rounded-2xl border border-transparent transition-all duration-300 cursor-pointer ${isDark
                                        ? 'bg-slate-700/30 hover:bg-slate-600/50 hover:border-slate-400/30 hover:-translate-y-0.5'
                                        : 'bg-white/60 hover:bg-white hover:border-red-500/15 hover:-translate-y-0.5'
                                        }`}
                                >
                                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${notif.type === 'PERMISSION_REQUEST'
                                        ? (isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-500')
                                        : (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-500')
                                        }`}>
                                        {renderIcon(notif.type)}
                                    </div>

                                    <div>
                                        <h4 className={`m-0 mb-1 text-[0.95rem] font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                            {notif.title}
                                        </h4>
                                        <p className={`m-0 text-[0.85rem] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {notif.message}
                                        </p>
                                        <div className={`mt-1.5 text-[0.75rem] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {formatTime(notif.createdAt)}
                                        </div>

                                        {notif.type === 'PERMISSION_REQUEST' && (
                                            <div className="flex gap-2.5 mt-3">
                                                <button
                                                    disabled={processingId === notif.id}
                                                    onClick={() => handleApprove(notif)}
                                                    className={`border border-transparent px-4 py-1.5 rounded-md text-[0.8rem] font-semibold cursor-pointer transition-all duration-300 disabled:opacity-50 ${isDark
                                                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-400/40 hover:text-emerald-300 hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:-translate-y-0.5'
                                                        : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100 hover:border-emerald-500/30 hover:text-emerald-600 hover:shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:-translate-y-0.5'
                                                        }`}>
                                                    Approve
                                                </button>
                                                <button
                                                    disabled={processingId === notif.id}
                                                    onClick={() => handleDecline(notif)}
                                                    className={`border border-transparent px-4 py-1.5 rounded-md text-[0.8rem] font-semibold cursor-pointer transition-all duration-300 disabled:opacity-50 ${isDark
                                                        ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 hover:border-rose-400/40 hover:text-rose-300 hover:shadow-[0_4px_12px_rgba(225,29,72,0.2)] hover:-translate-y-0.5'
                                                        : 'bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-500/30 hover:text-red-600 hover:shadow-[0_4px_12px_rgba(239,68,68,0.15)] hover:-translate-y-0.5'
                                                        }`}>
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(portalContent, document.body);
};

export default NotificationBox;