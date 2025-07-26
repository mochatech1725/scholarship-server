import express from 'express';
import {
  getAll,
  getByStudentId,
  getById,
  create,
  update,
  deleteApplication
} from '../controllers/application.controller.js';

const router = express.Router();

router.get('/', getAll);
router.get('/:application_id', getById);
router.get('/getByStudentId/:user_id', getByStudentId);
router.post('/create', create);
router.post('/update/:application_id', update);
router.delete('/delete/:application_id', deleteApplication);

export default router; 