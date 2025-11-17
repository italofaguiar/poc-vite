import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  signupSchema,
  loginSchema,
} from './auth';

describe('emailSchema', () => {
  it('should validate a correct email', () => {
    const result = emailSchema.safeParse('test@example.com');
    expect(result.success).toBe(true);
  });

  it('should reject an empty email', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email e obrigatorio');
    }
  });

  it('should reject an invalid email format', () => {
    const result = emailSchema.safeParse('invalid-email');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email invalido');
    }
  });
});

describe('passwordSchema', () => {
  it('should validate a password with 6+ characters', () => {
    const result = passwordSchema.safeParse('123456');
    expect(result.success).toBe(true);
  });

  it('should reject a password with less than 6 characters', () => {
    const result = passwordSchema.safeParse('12345');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Senha deve ter no minimo 6 caracteres'
      );
    }
  });

  it('should reject an empty password', () => {
    const result = passwordSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('signupSchema', () => {
  it('should validate correct signup data', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = signupSchema.safeParse({
      email: 'invalid-email',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing fields', () => {
    const result = signupSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should validate correct login data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'any-password',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Senha e obrigatoria');
    }
  });

  it('should accept password with any length for login', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '1',
    });
    expect(result.success).toBe(true);
  });
});
