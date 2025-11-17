import { describe, it, expect } from 'vitest';
import {
  chartDataPointSchema,
  tableRowSchema,
  dashboardDataSchema,
  userResponseSchema,
} from './dashboard';

describe('chartDataPointSchema', () => {
  it('should validate correct chart data point', () => {
    const result = chartDataPointSchema.safeParse({
      date: '2024-01',
      value: 100,
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing date', () => {
    const result = chartDataPointSchema.safeParse({
      value: 100,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing value', () => {
    const result = chartDataPointSchema.safeParse({
      date: '2024-01',
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-number value', () => {
    const result = chartDataPointSchema.safeParse({
      date: '2024-01',
      value: 'not-a-number',
    });
    expect(result.success).toBe(false);
  });
});

describe('tableRowSchema', () => {
  it('should validate correct table row', () => {
    const result = tableRowSchema.safeParse({
      id: 1,
      nome: 'Test Item',
      status: 'Ativo',
      valor: 100.5,
    });
    expect(result.success).toBe(true);
  });

  it('should validate all status types', () => {
    const statuses = ['Ativo', 'Pendente', 'Inativo'];
    statuses.forEach((status) => {
      const result = tableRowSchema.safeParse({
        id: 1,
        nome: 'Test',
        status,
        valor: 100,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid status', () => {
    const result = tableRowSchema.safeParse({
      id: 1,
      nome: 'Test',
      status: 'InvalidStatus',
      valor: 100,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const result = tableRowSchema.safeParse({
      id: 1,
      nome: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-number id', () => {
    const result = tableRowSchema.safeParse({
      id: 'not-a-number',
      nome: 'Test',
      status: 'Ativo',
      valor: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe('dashboardDataSchema', () => {
  it('should validate correct dashboard data', () => {
    const result = dashboardDataSchema.safeParse({
      user_email: 'test@example.com',
      chart_data: [
        { date: '2024-01', value: 100 },
        { date: '2024-02', value: 200 },
      ],
      table_data: [
        { id: 1, nome: 'Item 1', status: 'Ativo', valor: 100 },
        { id: 2, nome: 'Item 2', status: 'Pendente', valor: 200 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = dashboardDataSchema.safeParse({
      user_email: 'invalid-email',
      chart_data: [],
      table_data: [],
    });
    expect(result.success).toBe(false);
  });

  it('should validate empty arrays', () => {
    const result = dashboardDataSchema.safeParse({
      user_email: 'test@example.com',
      chart_data: [],
      table_data: [],
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid chart data item', () => {
    const result = dashboardDataSchema.safeParse({
      user_email: 'test@example.com',
      chart_data: [{ date: '2024-01' }], // missing value
      table_data: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid table data item', () => {
    const result = dashboardDataSchema.safeParse({
      user_email: 'test@example.com',
      chart_data: [],
      table_data: [{ id: 1, nome: 'Test' }], // missing status and valor
    });
    expect(result.success).toBe(false);
  });
});

describe('userResponseSchema', () => {
  it('should validate correct user response', () => {
    const result = userResponseSchema.safeParse({
      email: 'test@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = userResponseSchema.safeParse({
      email: 'invalid-email',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing email', () => {
    const result = userResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
