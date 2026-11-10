import React from "react";
import {
    IoChatboxOutline,
    IoLockClosedOutline,
    IoImageOutline,
    IoDownloadOutline,
} from "react-icons/io5";
import { SettingRow } from "../../ui/SettingRow";
import { Switch } from "../../ui/Switch";
import type { ChatVars, SharedSettings } from "../../types";

export type InfoPrivacyViewProps = {
    dark: boolean;
    cv: ChatVars;
    surface: string;
    subText: string;
    isGroup: boolean;
    shared: SharedSettings;
    canEditSettings: boolean;
    onTogglePrivacy: () => void;
};

export function InfoPrivacyView({
    dark,
    cv,
    surface,
    subText,
    isGroup,
    shared,
    canEditSettings,
    onTogglePrivacy,
}: InfoPrivacyViewProps) {
    const bullet = (icon: React.ReactNode, text: string) => (
        <div className="flex items-start gap-5 px-6 py-3">
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[22px] ${subText}`}>
                {icon}
            </span>
            <p className={`text-sm leading-snug ${dark ? "text-slate-100" : "text-slate-800"}`}>{text}</p>
        </div>
    );

    return (
        <div className={`${surface} min-h-full pb-8`}>
            <div className="flex justify-center pt-10 pb-8">
                <span className="relative flex h-24 w-28 items-center justify-center">
                    <span
                        className="flex h-20 w-24 items-center justify-center rounded-3xl rounded-tl-md text-white shadow-lg"
                        style={{ background: cv.accentGradient }}
                    >
                        <IoChatboxOutline className="text-5xl opacity-90" />
                    </span>
                    <span
                        className={`absolute -bottom-1 -right-1 flex h-12 w-12 items-center justify-center rounded-xl border-4 text-2xl text-white ${
                            dark ? "border-[#0E1626]" : "border-white"
                        }`}
                        style={{ background: shared.advPrivacy ? "#16a34a" : "#64748b" }}
                    >
                        <IoLockClosedOutline />
                    </span>
                </span>
            </div>

            <p className={`px-6 text-lg font-medium leading-snug ${dark ? "text-white" : "text-slate-900"}`}>
                Limit how messages and media from this chat can be shared outside of Gurukul Community
            </p>
            <p className={`px-6 pt-5 text-sm leading-relaxed ${subText}`}>
                {isGroup
                    ? "Messages in this group are visible only to its members and Super Admins, even if you don't turn on advanced chat privacy."
                    : "Messages in this chat are visible only to you and this contact, even if you don't turn on advanced chat privacy."}
            </p>
            <p className={`px-6 pt-5 pb-1 text-sm ${subText}`}>If you turn this on, people in this chat:</p>

            {bullet(<IoImageOutline />, "Can't download photos or documents")}
            {bullet(<IoChatboxOutline />, "Can't select or copy messages")}
            {bullet(<IoDownloadOutline />, "Can't export the chat")}

            <div className={`mx-6 mt-3 border-t ${dark ? "border-slate-700/80" : "border-slate-200"}`} />
            <div className="px-2 pt-2">
                <SettingRow
                    dark={dark}
                    icon={<IoLockClosedOutline />}
                    title="Advanced chat privacy"
                    subtitle={
                        canEditSettings
                            ? shared.advPrivacy
                                ? "Turned on"
                                : "Turned off"
                            : "Only admins can change this setting"
                    }
                    disabled={!canEditSettings}
                    onClick={onTogglePrivacy}
                    trailing={<Switch on={shared.advPrivacy} dark={dark} accent={cv.accent} />}
                />
            </div>
        </div>
    );
}
