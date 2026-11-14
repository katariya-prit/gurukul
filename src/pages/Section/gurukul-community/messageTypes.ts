import type { ChatMessage } from "./types";

export type ChatVars = any;
export type ReplyRef = { id: string; suid: string; name: string; text: string };
export type Reads = Record<string, Record<string, number>>;
export type Tick = "sent" | "delivered" | "read";

export type FwdTarget = {
    key: string;
    kind: "group" | "dm";
    title: string;
    avatar?: string | null;
    isSuper: boolean;
    sub?: string;
    disabled?: string;
};

export type MenuItem = {
    key: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    separatorBefore?: boolean;
};

export type MsgRow = {
    m: ChatMessage;
    day: string | null;
    mine: boolean;
    sameSender: boolean;
    showName: boolean;
    nameColor: string;
    avatar?: any;
};