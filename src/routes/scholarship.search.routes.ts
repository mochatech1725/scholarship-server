import express from 'express';
import {
  findScholarships,
  getScholarshipSources
} from '../controllers/scholarship.search.controller.js';

const router = express.Router();

// Main scholarship search endpoint (with AWS fallback)
router.post('/find', findScholarships);

// Get available scholarship sources
router.get('/sources', getScholarshipSources);

export default router;
