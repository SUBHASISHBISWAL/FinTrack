import { ValidationError } from '../utils/app-error.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });

    if (error) {
      const message = error.details.map(i => i.message).join(', ');
      return next(new ValidationError(message));
    }

    req[source] = value;
    next();
  };
};
