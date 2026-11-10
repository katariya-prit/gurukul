/* eslint-disable @typescript-eslint/no-explicit-any */
import { groupService } from "../../../../services/groupService";
import {
    AUTH_TOKEN_STORAGE_KEYS,
    AUTH_USER_STORAGE_KEYS,
    ID_KEYS,
    NAME_KEYS,
    ROLE_KEYS,
    STRICT_ID_KEYS,
} from "../constants";
import type { ChatUser, DirUser } from "../types";

export const isSuperRole = (v: any, name?: string) => {
    const r = String(v ?? "").toLowerCase();
    const n = String(name ?? "").toLowerCase().replace(/[^a-z]/g, "");
    return r.includes("super") || n === "superadmin";
};

export const decodeJwt = (token: string): any | null => {
    try {
        const part = token.split(".")[1];
        if (!part) return null;
        const json = decodeURIComponent(
            atob(part.replace(/-/g, "+").replace(/_/g, "/"))
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
};

export const pick = (d: any, keys: string[]) => {
    for (const k of keys) {
        const v = d?.[k];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
};

export const nameOf = (d: any): string => {
    const n = pick(d, NAME_KEYS);
    if (n && typeof n !== "object") return String(n);
    const fl = [pick(d, ["first_name", "firstName"]), pick(d, ["last_name", "lastName"])].filter(Boolean).join(" ");
    if (fl) return fl;
    const e = pick(d, ["email", "Email"]);
    return e ? String(e).split("@")[0] : "";
};

export const roleOf = (d: any): string | undefined => {
    const r = pick(d, ROLE_KEYS);
    if (r === undefined) return undefined;
    if (typeof r === "object") {
        const v = (r as any).role_code ?? (r as any).code ?? (r as any).name;
        return v ? String(v) : undefined;
    }
    return String(r);
};

export const toChatUser = (d: any): ChatUser | null => {
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    const suid = pick(d, ID_KEYS);
    const name = nameOf(d);
    if (suid === undefined || typeof suid === "object" || !name) return null;
    const role = roleOf(d);
    return {
        suid: String(suid),
        name,
        avatar: pick(d, ["avatar", "profile_image", "profile_pic"]),
        role,
        isSuper: isSuperRole(role, name),
    };
};

export const scoreUser = (d: any): number => {
    const id = pick(d, ID_KEYS);
    if (id === undefined || typeof id === "object") return 0;
    if (!nameOf(d)) return 0;
    let sc = 1;
    if (pick(d, STRICT_ID_KEYS) !== undefined) sc += 3;
    if (pick(d, ROLE_KEYS) !== undefined) sc += 2;
    if (pick(d, ["email", "Email"])) sc += 2;
    if (pick(d, ["avatar", "profile_image", "profile_pic"])) sc += 1;
    return sc;
};

type Candidate = { u: ChatUser; score: number };

export const collectUsers = (val: any, bonus: number, out: Candidate[], depth = 0) => {
    if (val === null || val === undefined || depth > 5) return;

    if (typeof val === "string") {
        const t = val.trim();
        if (t.startsWith("{") || t.startsWith("[")) {
            try {
                collectUsers(JSON.parse(t), bonus, out, depth + 1);
            } catch {
                /* not JSON */
            }
            return;
        }
        const tok = t.replace(/^Bearer\s+/i, "");
        if (tok.length > 40 && tok.split(".").length === 3) {
            const payload = decodeJwt(tok);
            if (payload) collectUsers(payload, bonus + 2, out, depth + 1);
        }
        return;
    }

    if (typeof val !== "object" || Array.isArray(val)) return; // skip lists (e.g. cached user lists)

    const sc = scoreUser(val);
    if (sc >= 3) {
        const u = toChatUser(val);
        if (u) out.push({ u, score: sc + bonus });
    }
    for (const v of Object.values(val)) collectUsers(v, bonus, out, depth + 1);
};

export const readAllStorage = (): [string, string][] => {
    const out: [string, string][] = [];
    for (const store of [localStorage, sessionStorage]) {
        try {
            for (let i = 0; i < store.length; i++) {
                const k = store.key(i);
                if (!k || k.startsWith("gurukul_chat_")) continue;
                const v = store.getItem(k);
                if (v) out.push([k, v]);
            }
        } catch {
            /* ignore */
        }
    }
    try {
        document.cookie.split(";").forEach((c) => {
            const i = c.indexOf("=");
            if (i < 1) return;
            const k = c.slice(0, i).trim();
            let v = c.slice(i + 1);
            try {
                v = decodeURIComponent(v);
            } catch {
                /* keep raw */
            }
            if (v) out.push([k, v]);
        });
    } catch {
        /* ignore */
    }
    return out;
};

export const resolveBaseUser = (): ChatUser | null => {
    try {
        const raw = localStorage.getItem("user");
        if (raw) {
            const u = JSON.parse(raw);
            if (u && (u.suid !== undefined || u.id !== undefined)) {
                const suid = String(u.suid ?? u.id);
                const role = u.roleCode || u.roleName || u.role;
                return {
                    suid,
                    name: u.name || u.username || "Me",
                    avatar: u.avatar || null,
                    role: role ? String(role) : undefined,
                    isSuper: isSuperRole(role, u.name),
                };
            }
        }
    } catch {
        /* continue fallback */
    }

    const entries = readAllStorage();
    const out: Candidate[] = [];
    for (const [k, raw] of entries) {
        const known = AUTH_USER_STORAGE_KEYS.includes(k) || AUTH_TOKEN_STORAGE_KEYS.includes(k);
        collectUsers(raw, known ? 5 : 0, out);
    }
    out.sort((a, b) => b.score - a.score);
    if (out[0]) return out[0].u;

    console.warn(
        "[GurukulCommunity] Logged-in user not found. Keys checked:",
        entries.map(([k]) => k)
    );
    return null;
};

export const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export const fetchAllUsers = async (): Promise<any[]> => {
    const svc: any = groupService;
    const candidates = ["getAllUsers", "getUsers", "getAvailableUsers", "getAllMembers", "getMembers", "fetchUsers", "getAllStudents"];
    for (const fn of candidates) {
        if (typeof svc?.[fn] !== "function") continue;
        try {
            const r = await svc[fn]();
            const arr = Array.isArray(r) ? r : r?.data?.users ?? r?.data?.data ?? r?.data ?? r?.users;
            if (Array.isArray(arr) && arr.length) return arr;
        } catch {
            /* try next */
        }
    }
    return [];
};

export const normalizeUser = (u: any): DirUser | null => {
    if (!u) return null;
    const suid = u.suid ?? u.user_id ?? u.id;
    const name =
        u.name ?? u.full_name ?? u.username ?? u.user_name ?? [u.first_name, u.last_name].filter(Boolean).join(" ");
    if (suid === undefined || suid === null || !name) return null;
    const role = u.role_code ?? u.role ?? u.role_name ?? u.user_type;
    return {
        suid: String(suid),
        name: String(name),
        avatar: u.avatar ?? u.profile_image ?? u.profile_pic,
        role_code: role ? String(role) : undefined,
        isSuper: isSuperRole(role, String(name)),
    };
};

export const hashStr = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
};
