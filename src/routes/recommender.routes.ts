import express from 'express';
import {
  getAll,
  getByStudentId,
  getById,
  create,
  update,
  deleteRecommender
} from '../controllers/recommender.controller.js';

const router = express.Router();

router.get('/', getAll);
router.get('/:recommender_id', getById);
router.get('/getByStudentId/:user_id', getByStudentId);
router.post('/create', create);
router.post('/update/:recommender_id', update);
router.delete('/delete/:recommender_id', deleteRecommender);

export default router; 