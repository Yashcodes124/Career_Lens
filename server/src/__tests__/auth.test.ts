import { describe, expect, it, vi } from 'vitest';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken, verifyToken } from '../utils/jwt.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/authValidator.js';

describe('Auth Utilities & Schemas', () => {
  it('hashes and compares passwords correctly', async () => {
    const raw = 'SecretPassword123!';
    const hash = await hashPassword(raw);
    expect(hash).not.toBe(raw);

    const isMatch = await comparePassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('signs and verifies JWT tokens', () => {
    const payload = { userId: 'usr-123', email: 'test@example.com', role: 'USER' };
    const token = signToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('usr-123');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('USER');
  });

  it('validates register input schema', () => {
    const valid = { email: 'user@domain.com', password: 'password123', name: 'Jane Doe' };
    expect(registerSchema.safeParse(valid).success).toBe(true);

    const invalidEmail = { email: 'not-an-email', password: 'password123', name: 'Jane Doe' };
    expect(registerSchema.safeParse(invalidEmail).success).toBe(false);

    const shortPassword = { email: 'user@domain.com', password: '123', name: 'Jane Doe' };
    expect(registerSchema.safeParse(shortPassword).success).toBe(false);
  });

  it('validates login input schema', () => {
    const valid = { email: 'user@domain.com', password: 'password123' };
    expect(loginSchema.safeParse(valid).success).toBe(true);

    const emptyPassword = { email: 'user@domain.com', password: '' };
    expect(loginSchema.safeParse(emptyPassword).success).toBe(false);
  });
});
