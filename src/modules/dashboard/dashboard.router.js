import { Router } from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// All dashboard endpoints require authentication
router.use(authenticate);

// Everyone can view summary and recent activity
router.get('/summary', dashboardController.getSummary);
router.get('/recent-activity', dashboardController.getRecentActivity);

// Only admins and analysts can view detailed breakdowns and trends
router.get(
  '/category-breakdown', 
  authorize('ADMIN', 'ANALYST'), 
  dashboardController.getCategoryBreakdown
);

router.get(
  '/trends', 
  authorize('ADMIN', 'ANALYST'), 
  dashboardController.getTrends
);

export default router;
