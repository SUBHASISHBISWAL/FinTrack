import * as dashboardService from './dashboard.service.js';
import { sendSuccess } from '../../utils/response.js';
import { DASHBOARD } from '../../utils/constants.js';

export const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary();
    sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await dashboardService.getCategoryBreakdown();
    sendSuccess(res, breakdown);
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const trends = await dashboardService.getTrends();
    sendSuccess(res, trends);
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    let limit = DASHBOARD.RECENT_ACTIVITY_DEFAULT_LIMIT;
    if (req.query.limit && !isNaN(req.query.limit)) {
      limit = Math.min(Math.max(parseInt(req.query.limit, 10), 1), DASHBOARD.RECENT_ACTIVITY_MAX_LIMIT);
    }
    
    const activity = await dashboardService.getRecentActivity(limit);
    sendSuccess(res, activity);
  } catch (error) {
    next(error);
  }
};
