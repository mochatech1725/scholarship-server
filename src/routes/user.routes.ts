import express from 'express';
import {
  getUsers,
  getUserById,
  getByStudentId,
  saveUserProfile
} from '../controllers/user.controller.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/getById/:user_id', getUserById);
router.get('/getByStudentId/:student_id', getByStudentId);
router.post('/saveProfile/:user_id', saveUserProfile);

export default router;
