import { ForbiddenError } from '../utils/app-error.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ForbiddenError('Access denied: No role assigned'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access denied: Requires one of roles [${allowedRoles.join(', ')}]`));
    }

    next();
  };
};
