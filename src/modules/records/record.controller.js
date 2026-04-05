import * as recordService from './record.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export const createRecord = async (req, res, next) => {
  try {
    const record = await recordService.createRecord(req.body, req.user.id);
    sendSuccess(res, record, 'Record created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getRecords = async (req, res, next) => {
  try {
    const { data, meta } = await recordService.getRecords(req.query);
    sendPaginated(res, data, meta);
  } catch (error) {
    next(error);
  }
};

export const getRecordById = async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(req.params.id);
    sendSuccess(res, record);
  } catch (error) {
    next(error);
  }
};

export const updateRecord = async (req, res, next) => {
  try {
    const record = await recordService.updateRecord(req.params.id, req.body);
    sendSuccess(res, record, 'Record updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteRecord = async (req, res, next) => {
  try {
    const result = await recordService.deleteRecord(req.params.id);
    sendSuccess(res, result, 'Record deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const restoreRecord = async (req, res, next) => {
  try {
    const record = await recordService.restoreRecord(req.params.id);
    sendSuccess(res, record, 'Record restored successfully');
  } catch (error) {
    next(error);
  }
};
