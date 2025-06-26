import express from 'express';
import {
  getAll,
  getByUserId,
  getById,
  create,
  update,
  deleteRecommender
} from '../controllers/recommender.controller.js';

const router = express.Router();

router.get('/', getAll);
router.get('/:id', getById);
router.get('/getByUserId/:userId', getByUserId);
router.post('/create', create);
router.post('/update/:id', update);
router.delete('/delete/:id', deleteRecommender);

export default router; 