import * as dashboardService from './dashboard.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getSummary = async (req, res, next) => {
  try {
    const summary = dashboardService.getSummary();
    sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = dashboardService.getCategoryBreakdown();
    sendSuccess(res, breakdown);
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const trends = dashboardService.getTrends();
    sendSuccess(res, trends);
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    // Parse limit from query, default to 5, max 20
    let limit = 5;
    if (req.query.limit && !isNaN(req.query.limit)) {
      limit = Math.min(Math.max(parseInt(req.query.limit, 10), 1), 20);
    }
    
    const activity = dashboardService.getRecentActivity(limit);
    sendSuccess(res, activity);
  } catch (error) {
    next(error);
  }
};
