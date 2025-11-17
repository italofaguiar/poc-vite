import { describe, it, expect } from 'vitest';
import { isApiError, getErrorMessage } from './index';
import type { ApiError } from './index';

describe('isApiError', () => {
  it('should return true for valid API error', () => {
    const error = {
      response: {
        status: 400,
        data: {
          detail: 'Error message',
        } as ApiError,
      },
    };
    expect(isApiError(error)).toBe(true);
  });

  it('should return false for regular Error', () => {
    const error = new Error('Regular error');
    expect(isApiError(error)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isApiError(undefined)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isApiError(null)).toBe(false);
  });

  it('should return false for string', () => {
    expect(isApiError('error string')).toBe(false);
  });

  it('should return false for object without response', () => {
    const error = { message: 'error' };
    expect(isApiError(error)).toBe(false);
  });

  it('should return false for object with null response', () => {
    const error = { response: null };
    expect(isApiError(error)).toBe(false);
  });

  it('should return false for object with response but no data', () => {
    const error = { response: { status: 400 } };
    expect(isApiError(error)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('should extract message from API error with string detail', () => {
    const error = {
      response: {
        status: 400,
        data: {
          detail: 'Email já cadastrado',
        } as ApiError,
      },
    };
    expect(getErrorMessage(error)).toBe('Email já cadastrado');
  });

  it('should extract message from API error with array detail', () => {
    const error = {
      response: {
        status: 422,
        data: {
          detail: [
            {
              loc: ['body', 'email'],
              msg: 'Email inválido',
              type: 'value_error',
            },
          ],
        } as ApiError,
      },
    };
    expect(getErrorMessage(error)).toBe('Email inválido');
  });

  it('should return fallback for regular error', () => {
    const error = new Error('Regular error');
    expect(getErrorMessage(error)).toBe('Erro desconhecido');
  });

  it('should use custom fallback message', () => {
    const error = new Error('Regular error');
    const customFallback = 'Erro personalizado';
    expect(getErrorMessage(error, customFallback)).toBe(customFallback);
  });

  it('should return fallback for null', () => {
    expect(getErrorMessage(null)).toBe('Erro desconhecido');
  });

  it('should return fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Erro desconhecido');
  });

  it('should return fallback for API error with empty array detail', () => {
    const error = {
      response: {
        status: 422,
        data: {
          detail: [],
        } as ApiError,
      },
    };
    expect(getErrorMessage(error)).toBe('Erro desconhecido');
  });

  it('should handle API error with malformed array detail', () => {
    const error = {
      response: {
        status: 422,
        data: {
          detail: [null],
        } as unknown as ApiError,
      },
    };
    expect(getErrorMessage(error)).toBe('Erro desconhecido');
  });
});
