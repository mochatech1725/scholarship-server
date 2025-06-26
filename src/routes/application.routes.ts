import express from 'express';
import {
  getAll,
  getByUserId,
  getById,
  create,
  update,
  deleteApplication
} from '../controllers/application.controller.js';

const router = express.Router();

router.get('/', getAll);
router.get('/:id', getById);
router.get('/getByUserId/:userId', getByUserId);
router.post('/create', create);
router.post('/update/:id', update);
router.delete('/delete/:id', deleteApplication);

export default router; 