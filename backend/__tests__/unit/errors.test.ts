import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';

describe('Error class hierarchy', () => {
  describe('AppError', () => {
    it('sets code, statusCode, message, and details', () => {
      const err = new AppError('TEST_ERROR', 418, 'Something went wrong', { key: 'value' });
      expect(err.code).toBe('TEST_ERROR');
      expect(err.statusCode).toBe(418);
      expect(err.message).toBe('Something went wrong');
      expect(err.details).toEqual({ key: 'value' });
      expect(err.name).toBe('AppError');
    });

    it('extends Error and has a stack trace', () => {
      const err = new AppError('CODE', 500, 'msg');
      expect(err).toBeInstanceOf(Error);
      expect(err.stack).toBeDefined();
    });

    it('details is optional', () => {
      const err = new AppError('CODE', 500, 'msg');
      expect(err.details).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('maps Zod issues to field-level details', () => {
      const issues = [
        { path: ['email'], message: 'Invalid email', code: 'invalid_type' as const, expected: 'string', received: 'undefined' },
        { path: ['address', 'zip'], message: 'Required', code: 'invalid_type' as const, expected: 'string', received: 'undefined' },
      ];
      const err = new ValidationError(issues as any);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Validation failed');
      expect(err.details).toEqual({
        fields: [
          { path: 'email', message: 'Invalid email' },
          { path: 'address.zip', message: 'Required' },
        ],
      });
      expect(err.name).toBe('ValidationError');
    });

    it('is an instance of AppError', () => {
      const err = new ValidationError([]);
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('UnauthorizedError', () => {
    it('has correct defaults', () => {
      const err = new UnauthorizedError();
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Authentication required');
      expect(err.name).toBe('UnauthorizedError');
    });

    it('is an instance of AppError', () => {
      const err = new UnauthorizedError();
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('ForbiddenError', () => {
    it('uses default code INSUFFICIENT_PERMISSIONS', () => {
      const err = new ForbiddenError();
      expect(err.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Access denied');
      expect(err.name).toBe('ForbiddenError');
    });

    it('accepts a custom code', () => {
      const err = new ForbiddenError('TENANT_INACTIVE');
      expect(err.code).toBe('TENANT_INACTIVE');
      expect(err.statusCode).toBe(403);
    });

    it('is an instance of AppError', () => {
      const err = new ForbiddenError();
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('NotFoundError', () => {
    it('constructs code from resource name', () => {
      const err = new NotFoundError('member', '123');
      expect(err.code).toBe('MEMBER_NOT_FOUND');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('member not found');
      expect(err.name).toBe('NotFoundError');
    });

    it('uppercases multi-word resource names', () => {
      const err = new NotFoundError('tenant', 'abc-def');
      expect(err.code).toBe('TENANT_NOT_FOUND');
    });

    it('is an instance of AppError', () => {
      const err = new NotFoundError('role', 'xyz');
      expect(err).toBeInstanceOf(AppError);
    });
  });
});
