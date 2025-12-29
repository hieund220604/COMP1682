import { Request, Response } from 'express';
import { groupService } from '../service/groupSerice';
import {
    CreateGroupRequest,
    UpdateGroupRequest,
    InviteRequest,
    AcceptInviteRequest,
    UpdateMemberRoleRequest,
    ApiResponse,
    GroupResponse,
    GroupMemberResponse,
    InviteResponse,
    GroupBalanceResponse
} from '../type/group';

export const groupController = {
    // Create a new group
    async createGroup(req: Request<{}, {}, CreateGroupRequest>, res: Response<ApiResponse<GroupResponse>>): Promise<void> {
        try {
            console.log('[DEBUG] createGroup headers:', req.headers);
            console.log('[DEBUG] createGroup body:', req.body);

            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { name } = req.body;
            if (!name) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Group name is required. If using Postman, ensure "Body" is set to "raw" -> "JSON" and "Content-Type" header is "application/json".',
                        code: 'VALIDATION_ERROR'
                    }
                });
                return;
            }
            const group = await groupService.createGroup(req.user.userId, req.body);
            res.status(201).json({ success: true, data: group });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create group';
            res.status(400).json({ success: false, error: { message, code: 'CREATE_GROUP_ERROR' } });
        }
    },

    // Get group by ID
    async getGroupById(req: Request<{ groupId: string }>, res: Response<ApiResponse<GroupResponse>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const group = await groupService.getGroupById(req.user.userId, groupId);
            res.status(200).json({ success: true, data: group });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get group';
            res.status(404).json({ success: false, error: { message, code: 'GET_GROUP_ERROR' } });
        }
    },

    // Get all groups for current user
    async getUserGroups(req: Request, res: Response<ApiResponse<GroupResponse[]>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const groups = await groupService.getGroupsForUser(req.user.userId);
            res.status(200).json({ success: true, data: groups });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get groups';
            res.status(400).json({ success: false, error: { message, code: 'GET_GROUPS_ERROR' } });
        }
    },

    // Update group
    async updateGroup(req: Request<{ groupId: string }, {}, UpdateGroupRequest>, res: Response<ApiResponse<GroupResponse>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const group = await groupService.updateGroup(req.user.userId, groupId, req.body);
            res.status(200).json({ success: true, data: group });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update group';
            const statusCode = message.includes('Permission denied') ? 403 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'UPDATE_GROUP_ERROR' } });
        }
    },

    // Delete group
    async deleteGroup(req: Request<{ groupId: string }>, res: Response<ApiResponse<null>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            await groupService.deleteGroup(req.user.userId, groupId);
            res.status(200).json({ success: true, data: null });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete group';
            const statusCode = message.includes('Permission denied') ? 403 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'DELETE_GROUP_ERROR' } });
        }
    },

    // Create invite
    async createInvite(req: Request<{ groupId: string }, {}, InviteRequest>, res: Response<ApiResponse<InviteResponse>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const { emailInvite, role } = req.body;
            if (!emailInvite) {
                res.status(400).json({ success: false, error: { message: 'Email is required', code: 'VALIDATION_ERROR' } });
                return;
            }
            const invite = await groupService.createInvite(req.user.userId, groupId, req.body);
            res.status(201).json({ success: true, data: invite });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create invite';
            const statusCode = message.includes('Permission denied') ? 403 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'CREATE_INVITE_ERROR' } });
        }
    },

    // Accept invite
    async acceptInvite(req: Request<{}, {}, AcceptInviteRequest>, res: Response<ApiResponse<GroupMemberResponse>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { token } = req.body;
            if (!token) {
                res.status(400).json({ success: false, error: { message: 'Token is required', code: 'VALIDATION_ERROR' } });
                return;
            }
            const member = await groupService.acceptInvite(req.user.userId, token);
            res.status(200).json({ success: true, data: member });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to accept invite';
            res.status(400).json({ success: false, error: { message, code: 'ACCEPT_INVITE_ERROR' } });
        }
    },

    // Get group members
    async getGroupMembers(req: Request<{ groupId: string }>, res: Response<ApiResponse<GroupMemberResponse[]>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const members = await groupService.getGroupMembers(req.user.userId, groupId);
            res.status(200).json({ success: true, data: members });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get group members';
            res.status(400).json({ success: false, error: { message, code: 'GET_MEMBERS_ERROR' } });
        }
    },

    // Update member role
    async updateMemberRole(req: Request<{ groupId: string; memberId: string }, {}, UpdateMemberRoleRequest>, res: Response<ApiResponse<GroupMemberResponse>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId, memberId } = req.params;
            const { role } = req.body;
            if (!role) {
                res.status(400).json({ success: false, error: { message: 'Role is required', code: 'VALIDATION_ERROR' } });
                return;
            }
            const member = await groupService.updateMemberRole(req.user.userId, groupId, memberId, role);
            res.status(200).json({ success: true, data: member });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update member role';
            const statusCode = message.includes('Permission denied') ? 403 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'UPDATE_ROLE_ERROR' } });
        }
    },

    // Remove member from group
    async removeMember(req: Request<{ groupId: string; memberId: string }>, res: Response<ApiResponse<null>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId, memberId } = req.params;
            await groupService.removeMember(req.user.userId, groupId, memberId);
            res.status(200).json({ success: true, data: null });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove member';
            const statusCode = message.includes('Permission denied') ? 403 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'REMOVE_MEMBER_ERROR' } });
        }
    },

    // Leave group
    async leaveGroup(req: Request<{ groupId: string }>, res: Response<ApiResponse<null>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            await groupService.leaveGroup(req.user.userId, groupId);
            res.status(200).json({ success: true, data: null });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to leave group';
            res.status(400).json({ success: false, error: { message, code: 'LEAVE_GROUP_ERROR' } });
        }
    },

    // Get group balance
    async getGroupBalance(req: Request<{ groupId: string }>, res: Response<ApiResponse<GroupBalanceResponse>>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const balance = await groupService.calculateGroupBalance(req.user.userId, groupId);
            res.status(200).json({ success: true, data: balance });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to calculate group balance';
            res.status(400).json({ success: false, error: { message, code: 'BALANCE_ERROR' } });
        }
    }
};
