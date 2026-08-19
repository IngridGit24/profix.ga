export const ApiResponse = {
  success: (data, message = 'Success', statusCode = 200) => ({
    success: true,
    message,
    data,
    statusCode,
    timestamp: new Date().toISOString(),
  }),

  error: (message = 'Error', statusCode = 500, errors = null) => ({
    success: false,
    message,
    errors,
    statusCode,
    timestamp: new Date().toISOString(),
  }),

  validation: (errors, message = 'Validation failed') => ({
    success: false,
    message,
    errors,
    statusCode: 422,
    timestamp: new Date().toISOString(),
  }),
};

export const Pagination = {
  default: {
    page: 1,
    limit: 15,
    maxLimit: 100,
  },

  create: (page = 1, limit = 15) => {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit) || 15, 100);
    const offset = (pageNum - 1) * limitNum;

    return { page: pageNum, limit: limitNum, offset };
  },

  meta: (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }),
};
