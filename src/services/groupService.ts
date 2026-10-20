/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

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
    is_leader?: boolean;
}

export const isGroupLeader = (group: Pick<GroupData, "is_leader">, _suid?: number | null): boolean => {
    return !!group.is_leader;
};

export interface CreateGroupPayload {
    group_name: string;
    description?: string;
    member_ids: number[];
}

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

// 🎯 NAVU: har API call mate Authorization header banavva mate helper
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    };
};

export const groupService = {
    createGroup: async (payload: CreateGroupPayload) => {
        try {
            const res = await axios.post(`${API_URL}/groups/create`, payload, getAuthHeaders());
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error creating group" };
        }
    },

    getAllGroups: async () => {
        try {
            const res = await axios.get(`${API_URL}/groups/list`, getAuthHeaders());
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching groups" };
        }
    },

    getGroupsByMember: async (suid: number) => {
        try {
            const res = await axios.get(`${API_URL}/groups/member/${suid}`, getAuthHeaders());
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching your groups" };
        }
    },

    getGroupById: async (groupId: number) => {
        try {
            const res = await axios.get(`${API_URL}/groups/${groupId}`, getAuthHeaders());
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching group" };
        }
    },

    getGroupMembers: async (groupId: number) => {
        try {
            const res = await axios.get(`${API_URL}/groups/${groupId}`, getAuthHeaders());
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
                    isLeader: idx === 0,
                })),
            };

            return { success: true, data: mapped };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching group" };
        }
    },

    updateGroup: async (groupId: number, payload: Partial<CreateGroupPayload>) => {
        try {
            const res = await axios.put(`${API_URL}/groups/${groupId}`, payload, getAuthHeaders());
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error updating group" };
        }
    },

    deleteGroup: async (groupId: number) => {
        try {
            const res = await axios.delete(`${API_URL}/groups/${groupId}`, getAuthHeaders());
            return { success: true, data: res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error deleting group" };
        }
    },
};