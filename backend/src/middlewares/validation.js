import { ApiResponse } from '../types/index.js';

export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(422).json(ApiResponse.validation(errors, 'Validation failed'));
    }

    req[property] = value;
    next();
  };
};

export const validateRequest = (schema, property = 'body') => validate(schema, property);
