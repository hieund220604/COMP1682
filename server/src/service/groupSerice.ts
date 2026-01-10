import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import crypto from 'crypto';
import {
    CreateGroupRequest,
    UpdateGroupRequest,
    GroupResponse,
    GroupMemberResponse,
    InviteRequest,
    InviteResponse,
    GroupBalanceResponse,
    GroupRole
} from '../type/group';

// Helper to transform user object from Prisma (null) to API format (undefined)
function transformUser(user: { id: string; email: string; displayName: string | null; avatarUrl: string | null }) {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined
    };
}

export const groupService = {
    // Create a new group
    async createGroup(userId: string, data: CreateGroupRequest): Promise<GroupResponse> {
        const group = await prisma.group.create({
            data: {
                name: data.name,
                baseCurrency: data.baseCurrency || 'VND',
                createdBy: userId,
                members: {
                    create: {
                        userId: userId,
                        role: 'OWNER'
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, displayName: true, avatarUrl: true }
                        }
                    }
                }
            }
        });

        return {
            id: group.id,
            name: group.name,
            description: '',
            baseCurrency: group.baseCurrency,
            createdAt: group.createdAt,
            createdBy: group.createdBy,
            memberCount: group.members.length,
            members: group.members.map(m => ({
                id: m.id,
                userId: m.userId,
                groupId: m.groupId,
                role: m.role as GroupRole,
                joinedAt: m.joinedAt,
                leftAt: m.leftAt,
                user: transformUser(m.user)
            }))
        };
    },

    // Get group by ID (validate user is member)
    async getGroupById(userId: string, groupId: string): Promise<GroupResponse> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('Group not found or access denied');
        }

        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: {
                    where: { leftAt: null },
                    include: {
                        user: {
                            select: { id: true, email: true, displayName: true, avatarUrl: true }
                        }
                    }
                }
            }
        });

        if (!group) {
            throw new Error('Group not found');
        }

        return {
            id: group.id,
            name: group.name,
            description: '',
            baseCurrency: group.baseCurrency,
            createdAt: group.createdAt,
            createdBy: group.createdBy,
            memberCount: group.members.length,
            members: group.members.map(m => ({
                id: m.id,
                userId: m.userId,
                groupId: m.groupId,
                role: m.role as GroupRole,
                joinedAt: m.joinedAt,
                leftAt: m.leftAt,
                user: transformUser(m.user)
            }))
        };
    },

    // Get all groups for a user
    async getGroupsForUser(userId: string): Promise<GroupResponse[]> {
        const memberships = await prisma.groupMember.findMany({
            where: { userId, leftAt: null },
            include: {
                group: {
                    include: {
                        members: {
                            where: { leftAt: null }
                        }
                    }
                }
            }
        });

        return memberships.map(m => ({
            id: m.group.id,
            name: m.group.name,
            description: '',
            baseCurrency: m.group.baseCurrency,
            createdAt: m.group.createdAt,
            createdBy: m.group.createdBy,
            memberCount: m.group.members.length
        }));
    },

    // Update group (requires OWNER or ADMIN)
    async updateGroup(userId: string, groupId: string, data: UpdateGroupRequest): Promise<GroupResponse> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new Error('Permission denied. Only OWNER or ADMIN can update group.');
        }

        const updatedGroup = await prisma.group.update({
            where: { id: groupId },
            data: {
                name: data.name,
                baseCurrency: data.baseCurrency
            },
            include: {
                members: {
                    where: { leftAt: null }
                }
            }
        });

        return {
            id: updatedGroup.id,
            name: updatedGroup.name,
            description: '',
            baseCurrency: updatedGroup.baseCurrency,
            createdAt: updatedGroup.createdAt,
            createdBy: updatedGroup.createdBy,
            memberCount: updatedGroup.members.length
        };
    },

    // Delete group (requires OWNER only)
    async deleteGroup(userId: string, groupId: string): Promise<void> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership || membership.role !== 'OWNER') {
            throw new Error('Permission denied. Only OWNER can delete group.');
        }

        await prisma.group.delete({
            where: { id: groupId }
        });
    },

    // Create invite
    async createInvite(userId: string, groupId: string, data: InviteRequest): Promise<InviteResponse> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new Error('Permission denied. Only OWNER or ADMIN can create invites.');
        }

        // Check if user is already a member
        const existingMember = await prisma.groupMember.findFirst({
            where: {
                groupId,
                user: { email: data.emailInvite },
                leftAt: null
            }
        });

        if (existingMember) {
            throw new Error('User is already a member of this group.');
        }

        // Check if invite already exists
        const existingInvite = await prisma.invite.findFirst({
            where: {
                groupId,
                emailInvite: data.emailInvite,
                status: 'PENDING'
            }
        });

        if (existingInvite) {
            throw new Error('An active invite already exists for this email.');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() + 7); // 7 days expiry

        const invite = await prisma.invite.create({
            data: {
                groupId,
                emailInvite: data.emailInvite,
                role: data.role || 'USER',
                token,
                status: 'PENDING',
                expiredAt
            }
        });

        return {
            id: invite.id,
            emailInvite: invite.emailInvite,
            role: invite.role as GroupRole,
            status: invite.status as 'PENDING' | 'ACCEPTED' | 'EXPIRED',
            expiresAt: invite.expiredAt,
            createdAt: invite.createdAt,
            token: invite.token
        };
    },

    // Accept invite
    async acceptInvite(userId: string, token: string): Promise<GroupMemberResponse> {
        const invite = await prisma.invite.findUnique({
            where: { token }
        });

        if (!invite) {
            throw new Error('Invalid invite token.');
        }

        if (invite.status !== 'PENDING') {
            throw new Error('This invite has already been used or expired.');
        }

        if (new Date() > invite.expiredAt) {
            await prisma.invite.update({
                where: { id: invite.id },
                data: { status: 'EXPIRED' }
            });
            throw new Error('This invite has expired.');
        }

        // Check if user email matches invite email
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.email !== invite.emailInvite) {
            throw new Error('This invite is not for your email address.');
        }

        // Check if already a member
        const existingMember = await prisma.groupMember.findFirst({
            where: { groupId: invite.groupId, userId, leftAt: null }
        });

        if (existingMember) {
            throw new Error('You are already a member of this group.');
        }

        // Create member and update invite in transaction
        const [member] = await prisma.$transaction([
            prisma.groupMember.create({
                data: {
                    groupId: invite.groupId,
                    userId,
                    role: invite.role
                },
                include: {
                    user: {
                        select: { id: true, email: true, displayName: true, avatarUrl: true }
                    }
                }
            }),
            prisma.invite.update({
                where: { id: invite.id },
                data: { status: 'ACCEPTED' }
            })
        ]);

        return {
            id: member.id,
            userId: member.userId,
            groupId: member.groupId,
            role: member.role as GroupRole,
            joinedAt: member.joinedAt,
            leftAt: member.leftAt,
            user: transformUser(member.user)
        };
    },

    // Get group members
    async getGroupMembers(userId: string, groupId: string): Promise<GroupMemberResponse[]> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('Group not found or access denied');
        }

        const members = await prisma.groupMember.findMany({
            where: { groupId, leftAt: null },
            include: {
                user: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                }
            },
            orderBy: { joinedAt: 'asc' }
        });

        return members.map(m => ({
            id: m.id,
            userId: m.userId,
            groupId: m.groupId,
            role: m.role as GroupRole,
            joinedAt: m.joinedAt,
            leftAt: m.leftAt,
            user: transformUser(m.user)
        }));
    },

    // Update member role (requires OWNER)
    async updateMemberRole(userId: string, groupId: string, memberId: string, newRole: GroupRole): Promise<GroupMemberResponse> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership || membership.role !== 'OWNER') {
            throw new Error('Permission denied. Only OWNER can update member roles.');
        }

        const targetMember = await prisma.groupMember.findUnique({
            where: { id: memberId }
        });

        if (!targetMember || targetMember.groupId !== groupId || targetMember.leftAt !== null) {
            throw new Error('Member not found in this group.');
        }

        if (targetMember.role === 'OWNER') {
            throw new Error('Cannot change the role of the group owner.');
        }

        if (newRole === 'OWNER') {
            throw new Error('Cannot assign OWNER role. Use transfer ownership instead.');
        }

        const updatedMember = await prisma.groupMember.update({
            where: { id: memberId },
            data: { role: newRole },
            include: {
                user: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                }
            }
        });

        return {
            id: updatedMember.id,
            userId: updatedMember.userId,
            groupId: updatedMember.groupId,
            role: updatedMember.role as GroupRole,
            joinedAt: updatedMember.joinedAt,
            leftAt: updatedMember.leftAt,
            user: transformUser(updatedMember.user)
        };
    },

    // Remove member from group (requires OWNER or ADMIN)
    async removeMember(userId: string, groupId: string, memberId: string): Promise<void> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new Error('Permission denied. Only OWNER or ADMIN can remove members.');
        }

        const targetMember = await prisma.groupMember.findUnique({
            where: { id: memberId }
        });

        if (!targetMember || targetMember.groupId !== groupId || targetMember.leftAt !== null) {
            throw new Error('Member not found in this group.');
        }

        if (targetMember.role === 'OWNER') {
            throw new Error('Cannot remove the group owner.');
        }

        // Soft delete by setting leftAt
        await prisma.groupMember.update({
            where: { id: memberId },
            data: { leftAt: new Date() }
        });
    },

    // Leave group
    async leaveGroup(userId: string, groupId: string): Promise<void> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('You are not a member of this group.');
        }

        if (membership.role === 'OWNER') {
            throw new Error('Owner cannot leave the group. Transfer ownership or delete the group instead.');
        }

        await prisma.groupMember.update({
            where: { id: membership.id },
            data: { leftAt: new Date() }
        });
    },

    // Calculate group balance
    async calculateGroupBalance(userId: string, groupId: string): Promise<GroupBalanceResponse> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('Group not found or access denied');
        }

        // Get all active members
        const members = await prisma.groupMember.findMany({
            where: { groupId, leftAt: null },
            include: {
                user: {
                    select: { id: true, displayName: true }
                }
            }
        });

        // Get all expenses for this group
        const expenses = await prisma.expense.findMany({
            where: { groupId },
            include: {
                shares: true
            }
        });

        // Get all settlements for this group
        const settlements = await prisma.settlement.findMany({
            where: { groupId }
        });

        // Calculate balance for each member
        const balances = members.map(member => {
            const memberId = member.userId;

            // Total amount this user paid for expenses
            const totalPaid = expenses
                .filter(e => e.paidBy === memberId)
                .reduce((sum, e) => sum + Number(e.amountTotal), 0);

            // Total amount this user owes from expense shares
            const totalOwed = expenses
                .flatMap(e => e.shares)
                .filter(s => s.userId === memberId)
                .reduce((sum, s) => sum + Number(s.owedAmount), 0);

            // Settlements sent (money out)
            const settlementsSent = settlements
                .filter(s => s.fromUserId === memberId)
                .reduce((sum, s) => sum + Number(s.amount), 0);

            // Settlements received (money in)
            const settlementsReceived = settlements
                .filter(s => s.toUserId === memberId)
                .reduce((sum, s) => sum + Number(s.amount), 0);

            // Net balance: positive = others owe this user, negative = this user owes others
            // totalLent = what user paid for others = totalPaid - (user's own share)
            // For simplicity: netBalance = (totalPaid - totalOwed) + (settlementsReceived - settlementsSent)
            const netBalance = (totalPaid - totalOwed) + (settlementsReceived - settlementsSent);

            return {
                userId: memberId,
                displayName: member.user.displayName || undefined,
                totalOwed: totalOwed,
                totalLent: totalPaid,
                netBalance: netBalance
            };
        });

        return {
            groupId,
            members: balances
        };
    },

    // Get pending invites for a user by their email
    async getPendingInvitesForUser(userId: string): Promise<InviteResponse[]> {
        // Get user email first
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });

        if (!user) {
            throw new Error('User not found');
        }

        const invites = await prisma.invite.findMany({
            where: {
                emailInvite: user.email,
                status: 'PENDING',
                expiredAt: { gt: new Date() }
            },
            include: {
                group: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return invites.map(invite => ({
            id: invite.id,
            emailInvite: invite.emailInvite,
            role: invite.role as GroupRole,
            status: invite.status as 'PENDING' | 'ACCEPTED' | 'EXPIRED',
            expiresAt: invite.expiredAt,
            createdAt: invite.createdAt,
            token: invite.token,
            groupName: invite.group.name,
            groupId: invite.groupId
        }));
    }
};