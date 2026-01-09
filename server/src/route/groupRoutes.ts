import { Router } from 'express';
import { groupController } from '../controller/groupController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Group CRUD
router.post('/', groupController.createGroup);
router.get('/', groupController.getUserGroups);
router.get('/:groupId', groupController.getGroupById);
router.patch('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);

// Invites
router.get('/invites/pending', groupController.getPendingInvites); // Must be before :groupId routes
router.post('/:groupId/invites', groupController.createInvite);
router.post('/invites/accept', groupController.acceptInvite);

// Members
router.get('/:groupId/members', groupController.getGroupMembers);
router.patch('/:groupId/members/:memberId/role', groupController.updateMemberRole);
router.delete('/:groupId/members/:memberId', groupController.removeMember);
router.post('/:groupId/leave', groupController.leaveGroup);

// Balance
router.get('/:groupId/balance', groupController.getGroupBalance);

export default router;
