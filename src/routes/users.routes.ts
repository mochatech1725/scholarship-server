import express from 'express';
import {
  getUsers,
  getUserById,
  saveUserProfile
} from '../controllers/user.controller.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/:userId', getUserById);
router.put('/:userId/profile', saveUserProfile);

export default router;
