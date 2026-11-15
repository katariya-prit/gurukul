/* eslint-disable @typescript-eslint/no-explicit-any */
import { IoArrowBack, IoClose } from "react-icons/io5";
import { HIDE_SCROLL } from "../constants";
import { InfoMain as InfoMainView } from "./info-views/InfoMainView";
import { InfoMedia as InfoMediaView } from "./info-views/InfoMediaView";
import { InfoPrivacy as InfoPrivacyView } from "./info-views/InfoPrivacyView";
import { InfoStarred as InfoStarredView } from "./info-views/InfoStarredView";
import { InfoPermissions as InfoPermissionsView } from "./info-views/InfoPermissionsView";
import { InfoAdmins as InfoAdminsView } from "./info-views/InfoAdminsView";
import { InfoAddMembers as InfoAddMembersView } from "./info-views/InfoAddMembersView";
import { InfoPending as InfoPendingView } from "./info-views/InfoPendingView";
import type { InfoView } from "../types";
import type { InfoCtx } from "./info-views/infoTypes";

export type ChatInfoDrawerProps = {
    c: InfoCtx;
    infoView: InfoView;
    onClose: () => void;
};

const infoBack = (v: InfoView): InfoView => (v === "admins" ? "permissions" : "main");

export function ChatInfoDrawer({ c, infoView, onClose }: ChatInfoDrawerProps) {
    const { dark, cv } = c;

    const infoTitle =
        infoView === "starred"
            ? "Starred messages"
            : infoView === "permissions"
                ? "Group permissions"
                : infoView === "admins"
                    ? "Edit group admins"
                    : infoView === "addMembers"
                        ? "Add members"
                        : infoView === "pending"
                            ? "Pending requests"
                            : infoView === "privacy"
                                ? "Advanced chat privacy"
                                : infoView === "media"
                                    ? "Media, links and docs"
                                    : c.isGroup
                                        ? "Group info"
                                        : "Contact info";

    const isMain = !infoView || infoView === "main";

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={infoTitle}
            /* Full cover of the chat column (header + messages + composer), same on mobile and desktop */
            className={`gk-info-panel absolute inset-0 z-30 flex flex-col ${dark ? "bg-[#0B1120] text-slate-100" : "bg-slate-50 text-slate-900"}`}
        >
            <style>{`
                @keyframes gkInfoFade { from { opacity: 0; } to { opacity: 1; } }
                @keyframes gkInfoBody { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
                .gk-info-panel { animation: gkInfoFade .12s ease-out both; }
                .gk-info-body { animation: gkInfoBody .18s ease-out backwards; }
                @media (prefers-reduced-motion: reduce) {
                    .gk-info-panel, .gk-info-body { animation: none; }
                }
            `}</style>

            {/* Accent line */}
            <div className="h-0.5 shrink-0" style={{ backgroundImage: `linear-gradient(to right, transparent, ${cv.accent}, transparent)` }} />

            {/* Header: X / Back + title (left aligned, full width) */}
            <div className={`flex shrink-0 items-center gap-3 border-b px-4 py-3 ${dark ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                <button
                    type="button"
                    onClick={() => (isMain ? onClose() : c.setInfoView(infoBack(infoView)))}
                    aria-label={isMain ? "Close" : "Back"}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                        dark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                    }`}
                >
                    {isMain ? <IoClose className="text-xl" /> : <IoArrowBack className="text-xl" />}
                </button>
                <h3 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight">{infoTitle}</h3>
            </div>

            {/* Body: full width, scrolls inside the overlay. key restarts the entry animation (and scroll) on every sub-screen */}
            <div key={infoView || "main"} className={`gk-info-body min-h-0 flex-1 overflow-y-auto overscroll-contain ${HIDE_SCROLL}`}>
                {infoView === "starred" && <InfoStarredView c={c} />}
                {infoView === "permissions" && <InfoPermissionsView c={c} />}
                {infoView === "admins" && <InfoAdminsView c={c} />}
                {infoView === "addMembers" && <InfoAddMembersView c={c} />}
                {infoView === "pending" && <InfoPendingView c={c} />}
                {infoView === "privacy" && <InfoPrivacyView c={c} />}
                {infoView === "media" && <InfoMediaView c={c} />}
                {isMain && <InfoMainView c={c} />}
            </div>
        </div>
    );
}

export default ChatInfoDrawer;