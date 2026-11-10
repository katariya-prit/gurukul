import type { KeyboardEvent } from "react";
import {
    HiCheckCircle,
    HiExclamation,
    HiInformationCircle,
    HiOutlineX,
    HiXCircle,
    HiOutlineChatAlt2,
} from "react-icons/hi";
import { useTheme } from "../theme/ThemeContext";
import type { NotificationItem } from "../../services/notificationService";

interface NotificationCardProps {
    notification: NotificationItem;
    onActivate: (notification: NotificationItem) => void;
    unread?: boolean;
    toast?: boolean;
    onDismiss?: (id: string) => void;
}

const typeIcons = {
    success: HiCheckCircle,
    warning: HiExclamation,
    error: HiXCircle,
    info: HiInformationCircle,
    chat: HiOutlineChatAlt2,
};

function getRelativeTime(value: string): string {
    const timestamp = new Date(value).getTime();
    if (!value || !Number.isFinite(timestamp)) {
        return "now";
    }

    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1) {
        return "now";
    }
    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }

    return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationCard({
    notification,
    onActivate,
    unread = false,
    toast = false,
    onDismiss,
}: NotificationCardProps) {
    const { theme } = useTheme();
    const Icon =
        typeIcons[notification.type.toLowerCase() as keyof typeof typeIcons] ??
        typeIcons.info;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) {
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onActivate(notification);
        }
    };

    return (
        <div
            role={toast ? "group" : "button"}
            tabIndex={0}
            aria-label={`${unread ? "Unread notification. " : ""}${notification.title}. ${notification.message}`}
            onClick={() => onActivate(notification)}
            onKeyDown={handleKeyDown}
            className={`group relative flex h-[76px] cursor-pointer items-center gap-2.5 overflow-hidden rounded-[16px] border px-3 shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 ${
                theme
                    ? `border-neutral-800 ${unread ? "bg-neutral-800 text-white" : "bg-neutral-900 text-white/80"} focus-visible:ring-blue-400`
                    : `border-neutral-200 ${unread ? "bg-red-50 text-neutral-900" : "bg-white text-neutral-700"} focus-visible:ring-red-500`
            }`}
        >
            <span
                aria-hidden="true"
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white ${
                    theme ? "from-blue-400 to-blue-700" : "from-red-400 to-red-700"
                }`}
            >
                <Icon className="text-xl" />
            </span>
            <span className="relative min-w-0 flex-1 self-stretch py-2">
                <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold leading-5">
                        {notification.title}
                    </span>
                    <time
                        dateTime={notification.createdAt}
                        className={`shrink-0 text-[11px] leading-4 ${
                            theme ? "text-white/60" : "text-neutral-500"
                        }`}
                    >
                        {getRelativeTime(notification.createdAt)}
                    </time>
                </span>
                <span
                    className={`line-clamp-2 text-[13px] leading-[1.35] ${
                        theme ? "text-white/65" : "text-neutral-600"
                    }`}
                >
                    {notification.message}
                </span>
            </span>
            {unread && (
                <span
                    aria-hidden="true"
                    className={`relative h-2 w-2 shrink-0 rounded-full ${
                        theme ? "bg-blue-400" : "bg-red-500"
                    }`}
                />
            )}
            {toast && onDismiss && (
                <button
                    type="button"
                    aria-label={`Dismiss notification: ${notification.title}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        onDismiss(notification.id);
                    }}
                    className={`absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 ${
                        theme
                            ? "bg-neutral-700 text-white focus-visible:ring-blue-400"
                            : "bg-white text-neutral-700 shadow-sm focus-visible:ring-red-500"
                    }`}
                >
                    <HiOutlineX aria-hidden="true" className="text-xs" />
                </button>
            )}
        </div>
    );
}
