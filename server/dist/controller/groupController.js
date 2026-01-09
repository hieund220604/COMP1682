"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupController = void 0;
const groupSerice_1 = require("../service/groupSerice");
exports.groupController = {
    // Create a new group
    async createGroup(req, res) {
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
            const group = await groupSerice_1.groupService.createGroup(req.user.userId, req.body);
            res.status(201).json({ success: true, data: group });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create group';
            res.status(400).json({ success: false, error: { message, code: 'CREATE_GROUP_ERROR' } });
        }
    },
    // Get group by ID
    async getGroupById(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const group = await groupSerice_1.groupService.getGroupById(req.user.userId, groupId);
            res.status(200).json({ success: true, data: group });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get group';
            res.status(404).json({ success: false, error: { message, code: 'GET_GROUP_ERROR' } });
        }
    },
    // Get all groups for current user
    async getUserGroups(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const groups = await groupSerice_1.groupService.getGroupsForUser(req.user.userId);
            res.status(200).json({ success: true, data: groups });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get groups';
            res.status(400).json({ success: false, error: { message, code: 'GET_GROUPS_ERROR' } });
        }
    },
    // Update group
    async updateGroup(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const group = await groupSerice_1.groupService.updateGroup(req.user.userId, groupId, req.body);
            res.status(200).json({ success: true, data: group });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update group';
            const statusCode = message.includes('Permission denied') ? 403 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'UPDATE_GROUP_ERROR' } });
        }
    },
    // Delete group
    async deleteGroup(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            await groupSerice_1.groupService.deleteGroup(req.user.userId, groupId);
            res.status(200).json({ success: true, data: null });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete group';
            const statusCode = message.includes('Permission denied') ? 403 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'DELETE_GROUP_ERROR' } });
        }
    },
    // Create invite
    async createInvite(req, res) {
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
            const invite = await groupSerice_1.groupService.createInvite(req.user.userId, groupId, req.body);
            res.status(201).json({ success: true, data: invite });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create invite';
            const statusCode = message.includes('Permission denied') ? 403 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'CREATE_INVITE_ERROR' } });
        }
    },
    // Accept invite
    async acceptInvite(req, res) {
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
            const member = await groupSerice_1.groupService.acceptInvite(req.user.userId, token);
            res.status(200).json({ success: true, data: member });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to accept invite';
            res.status(400).json({ success: false, error: { message, code: 'ACCEPT_INVITE_ERROR' } });
        }
    },
    // Get group members
    async getGroupMembers(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const members = await groupSerice_1.groupService.getGroupMembers(req.user.userId, groupId);
            res.status(200).json({ success: true, data: members });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get group members';
            res.status(400).json({ success: false, error: { message, code: 'GET_MEMBERS_ERROR' } });
        }
    },
    // Update member role
    async updateMemberRole(req, res) {
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
            const member = await groupSerice_1.groupService.updateMemberRole(req.user.userId, groupId, memberId, role);
            res.status(200).json({ success: true, data: member });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update member role';
            const statusCode = message.includes('Permission denied') ? 403 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'UPDATE_ROLE_ERROR' } });
        }
    },
    // Remove member from group
    async removeMember(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId, memberId } = req.params;
            await groupSerice_1.groupService.removeMember(req.user.userId, groupId, memberId);
            res.status(200).json({ success: true, data: null });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove member';
            const statusCode = message.includes('Permission denied') ? 403 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'REMOVE_MEMBER_ERROR' } });
        }
    },
    // Leave group
    async leaveGroup(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            await groupSerice_1.groupService.leaveGroup(req.user.userId, groupId);
            res.status(200).json({ success: true, data: null });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to leave group';
            res.status(400).json({ success: false, error: { message, code: 'LEAVE_GROUP_ERROR' } });
        }
    },
    // Get group balance
    async getGroupBalance(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const balance = await groupSerice_1.groupService.calculateGroupBalance(req.user.userId, groupId);
            res.status(200).json({ success: true, data: balance });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to calculate group balance';
            res.status(400).json({ success: false, error: { message, code: 'BALANCE_ERROR' } });
        }
    },
    // Get pending invites for current user
    async getPendingInvites(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const invites = await groupSerice_1.groupService.getPendingInvitesForUser(req.user.userId);
            res.status(200).json({ success: true, data: invites });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get pending invites';
            res.status(400).json({ success: false, error: { message, code: 'GET_INVITES_ERROR' } });
        }
    }
};
