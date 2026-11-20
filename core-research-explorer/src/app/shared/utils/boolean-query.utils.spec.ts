import { validateBooleanQuery } from './boolean-query.utils';

describe('validateBooleanQuery', () => {
  it('accepts the example Boolean query', () => {
    expect(validateBooleanQuery('drone AND (package OR delivery)').valid).toBe(true);
  });

  it('rejects empty input', () => {
    expect(validateBooleanQuery('   ').valid).toBe(false);
  });

  it('rejects unmatched parentheses', () => {
    expect(validateBooleanQuery('drone AND (delivery').valid).toBe(false);
  });

  it('rejects trailing operators', () => {
    expect(validateBooleanQuery('drone AND').valid).toBe(false);
  });

  it('rejects operators placed beside closing or opening parentheses', () => {
    expect(validateBooleanQuery('(drone AND) OR delivery').valid).toBe(false);
  });

  it('rejects unmatched closing parentheses', () => {
    expect(validateBooleanQuery('drone AND delivery)').valid).toBe(false);
  });

  it('allows NOT and nested parentheses', () => {
    expect(validateBooleanQuery('NOT drone AND (delivery OR package)').valid).toBe(true);
  });
});
