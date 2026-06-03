import { describe, it, expect } from 'vitest';
import { successResponse, errorResponse } from '../../lib/response.js';
import { AppError, ValidationError, NotFoundError } from '../../lib/errors.js';
import type { PaginationMeta, ApiSuccessResponse, ApiErrorResponse } from '../../lib/response.js';

describe('API response envelope helpers', () => {
  describe('successResponse', () => {
    it('returns statusCode 200 with Content-Type header', () => {
      const result = successResponse({ id: '1' });
      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('wraps data in ApiSuccessResponse envelope', () => {
      const data = { name: 'Test Club', id: 'abc-123' };
      const result = successResponse(data);
      const body: ApiSuccessResponse<typeof data> = JSON.parse(result.body);
      expect(body.data).toEqual(data);
      expect(body.meta).toBeUndefined();
    });

    it('includes pagination meta when provided', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const meta: PaginationMeta = { page: 1, pageSize: 50, total: 100, nextToken: 'abc' };
      const result = successResponse(data, meta);
      const body: ApiSuccessResponse<typeof data> = JSON.parse(result.body);
      expect(body.data).toEqual(data);
      expect(body.meta).toEqual(meta);
    });

    it('omits meta key when not provided', () => {
      const result = successResponse('hello');
      const body = JSON.parse(result.body);
      expect('meta' in body).toBe(false);
    });

    it('handles null data', () => {
      const result = successResponse(null);
      const body = JSON.parse(result.body);
      expect(body.data).toBeNull();
    });

    it('handles empty array data', () => {
      const result = successResponse([]);
      const body = JSON.parse(result.body);
      expect(body.data).toEqual([]);
    });

    it('produces valid JSON body', () => {
      const data = { nested: { value: 42, list: [1, 2, 3] } };
      const result = successResponse(data);
      expect(() => JSON.parse(result.body)).not.toThrow();
    });
  });

  describe('errorResponse', () => {
    it('returns the error statusCode from AppError', () => {
      const err = new AppError('TEST_ERROR', 418, 'Teapot');
      const result = errorResponse(err);
      expect(result.statusCode).toBe(418);
    });

    it('includes Content-Type header', () => {
      const err = new AppError('ERR', 500, 'fail');
      const result = errorResponse(err);
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('wraps error in ApiErrorResponse envelope', () => {
      const err = new AppError('SOME_CODE', 400, 'Bad request');
      const result = errorResponse(err);
      const body: ApiErrorResponse = JSON.parse(result.body);
      expect(body.error.code).toBe('SOME_CODE');
      expect(body.error.message).toBe('Bad request');
      expect(body.error.details).toBeUndefined();
    });

    it('includes details when present on AppError', () => {
      const err = new AppError('VALIDATION_ERROR', 400, 'Validation failed', {
        fields: [{ path: 'email', message: 'Invalid' }],
      });
      const result = errorResponse(err);
      const body: ApiErrorResponse = JSON.parse(result.body);
      expect(body.error.details).toEqual({
        fields: [{ path: 'email', message: 'Invalid' }],
      });
    });

    it('works with ValidationError subclass', () => {
      const issues = [
        { path: ['name'], message: 'Required', code: 'invalid_type' as const, expected: 'string', received: 'undefined' },
      ];
      const err = new ValidationError(issues as any);
      const result = errorResponse(err);
      const body: ApiErrorResponse = JSON.parse(result.body);
      expect(result.statusCode).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toBeDefined();
    });

    it('works with NotFoundError subclass', () => {
      const err = new NotFoundError('member', '123');
      const result = errorResponse(err);
      const body: ApiErrorResponse = JSON.parse(result.body);
      expect(result.statusCode).toBe(404);
      expect(body.error.code).toBe('MEMBER_NOT_FOUND');
      expect(body.error.message).toBe('member not found');
    });

    it('produces valid JSON body', () => {
      const err = new AppError('ERR', 500, 'Something broke');
      const result = errorResponse(err);
      expect(() => JSON.parse(result.body)).not.toThrow();
    });
  });
});
