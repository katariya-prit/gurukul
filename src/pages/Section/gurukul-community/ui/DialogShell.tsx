import React from "react";
import { IoClose } from "react-icons/io5";

export function DialogShell({
    dark,
    title,
    onClose,
    children,
}: {
    dark: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
            <div onClick={onClose} className="absolute inset-0 bg-black/55" />
            <div
                className={`relative w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl ${
                    dark ? "border-slate-700 bg-[#0E1626] text-slate-100" : "border-slate-200 bg-white text-slate-900"
                }`}
                style={{ animation: "gkDialogIn .18s ease-out" }}
            >
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="text-base font-bold tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${dark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    >
                        <IoClose className="text-xl" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
