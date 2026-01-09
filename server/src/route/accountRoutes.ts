import { Router } from 'express';
import { accountController } from '../controller/accountController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Initiate Top-Up
router.post('/top-up', authMiddleware, accountController.initiateTopUp);

export default router;
