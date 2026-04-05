import { Router } from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get income, expense, and net balance totals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary data
 */
router.get('/summary', dashboardController.getSummary);

/**
 * @openapi
 * /api/dashboard/recent-activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent financial activity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 20
 *     responses:
 *       200:
 *         description: Recent records
 */
router.get('/recent-activity', dashboardController.getRecentActivity);

/**
 * @openapi
 * /api/dashboard/category-breakdown:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category-wise totals (Admin, Analyst)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown
 *       403:
 *         description: Forbidden
 */
router.get(
  '/category-breakdown',
  authorize('ADMIN', 'ANALYST'),
  dashboardController.getCategoryBreakdown
);

/**
 * @openapi
 * /api/dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly income/expense trends (Admin, Analyst)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly trends
 *       403:
 *         description: Forbidden
 */
router.get(
  '/trends',
  authorize('ADMIN', 'ANALYST'),
  dashboardController.getTrends
);

export default router;
