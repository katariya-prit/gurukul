import { CHAT_API_BASE } from "../constants";

/* -------------------------------------------------------------------------- */
/*  Tells the server "I am typing" so it can push it to the other person(s)    */
/*  through Transmit. Best effort only: a failed typing ping is never shown.   */
/*                                                                             */
/*  POST {CHAT_API_BASE}/chat/typing                                           */
/*  body: { conv_key, to_suids: string[], typing: boolean }                    */
/* -------------------------------------------------------------------------- */
export const sendTypingRemote = async (p: { convKey: string; toSuids: string[]; typing: boolean }): Promise<void> => {
    if (!CHAT_API_BASE || p.toSuids.length === 0) return;
    try {
        await fetch(`${CHAT_API_BASE}/chat/typing`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify({ conv_key: p.convKey, to_suids: p.toSuids, typing: p.typing }),
        });
    } catch {
        /* typing is best effort */
    }
};