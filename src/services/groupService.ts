/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "./apiClient";

export interface GroupMember {
    suid: number;
    name: string;
    role_code?: string;
    avatar?: string
}

export interface AvailableGroupMember {
    suid: number;
    name: string;
    role_code: string;
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

export const groupService = {
    getAvailableMembers: async (): Promise<
        | { success: true; data: AvailableGroupMember[] }
        | { success: false; message: string }
    > => {
        try {
            const res = await api.get("/groups/members");
            return { success: true, data: res.data?.data ?? [] };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching group members" };
        }
    },

    createGroup: async (payload: CreateGroupPayload) => {
        try {
            const res = await api.post("/groups/create", payload);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error creating group" };
        }
    },

    getAllGroups: async () => {
        try {
            const res = await api.get("/groups/list");
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching groups" };
        }
    },

    getGroupsByMember: async (suid: number) => {
        try {
            const res = await api.get(`/groups/member/${suid}`);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching your groups" };
        }
    },

    getGroupById: async (groupId: number) => {
        try {
            const res = await api.get(`/groups/${groupId}`);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching group" };
        }
    },

    getGroupMembers: async (groupId: number) => {
        try {
            const res = await api.get(`/groups/${groupId}`);
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
            const res = await api.put(`/groups/${groupId}`, payload);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error updating group" };
        }
    },

    deleteGroup: async (groupId: number) => {
        try {
            const res = await api.delete(`/groups/${groupId}`);
            return { success: true, data: res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error deleting group" };
        }
    },
};