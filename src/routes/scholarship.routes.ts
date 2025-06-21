import express from 'express';
import {
  getAll,
  getByUserId,
  getById,
  create,
  update,
  deleteScholarship
} from '../controllers/scholarship.controller.js';

const router = express.Router();

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:userId', getByUserId);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', deleteScholarship);

export default router; 