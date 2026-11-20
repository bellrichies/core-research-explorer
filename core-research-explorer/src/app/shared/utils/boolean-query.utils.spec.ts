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
});
