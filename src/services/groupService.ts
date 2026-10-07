/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios"; // 👈 tamara existing api client no actual path check kari levo

export interface GroupMember {
    suid: number;
    name: string;
    role_code?: string;
    avatar?: string
}

export interface GroupData {
    group_id: number;
    group_name: string;
    description: string | null;
    created_by: number;
    created_by_name?: string;
    members: GroupMember[];
    created_at?: string;
    // 🆕 getGroupsByMember API thi aave chhe (Navbar "My Groups" mate) —
    // backend already nakki kare chhe: member_ids[1] === logged-in suid
    is_leader?: boolean;
}

// 🎯 Navbar "My Groups" mate — leader flag backend thi j aave chhe (member_ids no pahelo member).
// suid param signature-compatibility mate rakhyu chhe, pan vaparyu nathi — backend j source of truth chhe.
export const isGroupLeader = (group: Pick<GroupData, "is_leader">, _suid?: number | null): boolean => {
    return !!group.is_leader;
};

export interface CreateGroupPayload {
    group_name: string;
    description?: string;
    member_ids: number[];
}

// 🆕 GroupMemberDetail.tsx page mate — camelCase shape, leader flag sathe
export interface GroupMemberDetailItem {
    suid: number;
    name: string;
    username: string;
    roleCode: string;
    isLeader: boolean;
}

export interface GroupDetail {
    groupId: number;
    groupName: string;
    description: string | null;
    members: GroupMemberDetailItem[];
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export const groupService = {
    createGroup: async (payload: CreateGroupPayload) => {
        try {
            const res = await axios.post(`${API_URL}/groups/create`, payload);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error creating group" };
        }
    },

    getAllGroups: async () => {
        try {
            const res = await axios.get(`${API_URL}/groups/list`);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching groups" };
        }
    },

    // 🆕 Logged-in user je je groups no member chhe te — Navbar "My Groups" mate
    getGroupsByMember: async (suid: number) => {
        try {
            const res = await axios.get(`${API_URL}/groups/member/${suid}`);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching your groups" };
        }
    },

    // Edit page prefill karva mate (raw snake_case shape)
    getGroupById: async (groupId: number) => {
        try {
            const res = await axios.get(`${API_URL}/groups/${groupId}`);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching group" };
        }
    },

    // 🆕 GroupMemberDetail.tsx page mate — camelCase mapped shape, isLeader flag sathe.
    // 👑 Leader = member_ids array ma sauthi pahela add thayelo member (index 0) —
    // backend "getGroupById" already members ne array_position thi order karine mokle chhe.
    getGroupMembers: async (groupId: number) => {
        try {
            const res = await axios.get(`${API_URL}/groups/${groupId}`);
            const raw = res.data?.data ?? res.data;

            const mapped: GroupDetail = {
                groupId: raw.group_id,
                groupName: raw.group_name,
                description: raw.description,
                members: (raw.members || []).map((m: any, idx: number) => ({
                    suid: m.suid,
                    name: m.name,
                    username: m.username ?? "",
                    roleCode: m.role_code ?? "",
                    isLeader: idx === 0, // 👑 array no pahelo member = leader
                })),
            };

            return { success: true, data: mapped };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching group" };
        }
    },

    updateGroup: async (groupId: number, payload: Partial<CreateGroupPayload>) => {
        try {
            const res = await axios.put(`${API_URL}/groups/${groupId}`, payload);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error updating group" };
        }
    },

    deleteGroup: async (groupId: number) => {
        try {
            const res = await axios.delete(`${API_URL}/groups/${groupId}`);
            return { success: true, data: res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error deleting group" };
        }
    },
};