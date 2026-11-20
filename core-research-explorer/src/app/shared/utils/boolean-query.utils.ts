export interface QueryValidation {
  valid: boolean;
  message: string | null;
}

export function validateBooleanQuery(value: string): QueryValidation {
  const query = value.trim();
  if (!query) return { valid: false, message: 'Enter a search query.' };
  if (/[()]$/.test(query) && /\($/.test(query)) {
    return { valid: false, message: 'Close the open parenthesis.' };
  }

  let depth = 0;
  for (const character of query) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (depth < 0) return { valid: false, message: 'The query contains unmatched parentheses.' };
  }
  if (depth !== 0) return { valid: false, message: 'The query contains unmatched parentheses.' };

  if (/(AND|OR|NOT)\s*$|\(\s*$|\b(AND|OR|NOT)\s*\)/i.test(query)) {
    return { valid: false, message: 'The query ends or places an operator incorrectly.' };
  }

  return { valid: true, message: null };
}
