import { catalog } from '../data/catalog';

export const redeemCodes = {
  DEMOLOVE: ['love'],
  DEMOCAREER: ['career'],
  DEMOPERSONALITY: ['personality'],
  DEMOALL: ['love', 'career', 'personality'],
} as const;

export const codeScopes = [
  { value: 'single', label: '单个测试', prefix: 'TEST' },
  { value: 'love', label: '恋爱测试', prefix: 'LOVE' },
  { value: 'career', label: '职业测试', prefix: 'CAREER' },
  { value: 'personality', label: '性格与成长', prefix: 'GROWTH' },
  { value: 'all', label: '全部测试', prefix: 'ALL' },
] as const;
export type CodeScope = typeof codeScopes[number]['value'];
const testIds = new Set<string>(catalog.map(q => q[0]));
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function validCode(value: string, category: string, quizId?: string): boolean {
  const normalized = value.trim().toUpperCase();
  const legacyKey = normalized as keyof typeof redeemCodes;
  if (Object.hasOwn(redeemCodes, legacyKey)) {
    return redeemCodes[legacyKey].some(c => c === category);
  }
  const packageMatch = /^(LOVE|CAREER|GROWTH|ALL)-([A-Z0-9]{5})$/.exec(normalized);
  if (packageMatch) {
    const scope = codeScopes.find(s => s.prefix === packageMatch[1])?.value;
    return ['love', 'career', 'personality'].includes(category) && (scope === 'all' || scope === category);
  }
  const singleMatch = /^TEST-([A-Z]+(?:-[A-Z]+)*)-([A-Z0-9]{5})$/.exec(normalized);
  if (!singleMatch || !quizId) return false;
  const target = singleMatch[1].toLowerCase();
  return testIds.has(target) && target === quizId && catalog.some(q => q[0] === target && q[1] === category);
}

// The prefix is the permission rule. Codes are intentionally reusable and require no server or registry.
export function generateCodes(scope: CodeScope, count: number, quizId?: string): string[] {
  const setting = codeScopes.find(s => s.value === scope);
  if (!setting || ![10, 50, 100].includes(count)) throw new Error('请选择兑换范围和生成数量。');
  if (scope === 'single' && (!quizId || !testIds.has(quizId))) throw new Error('请选择一个测试。');
  const prefix = scope === 'single' ? `TEST-${quizId!.toUpperCase()}` : setting.prefix;
  const codes = new Set<string>();
  while (codes.size < count) {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    const suffix = Array.from(bytes, n => alphabet[n % alphabet.length]).join('');
    codes.add(`${prefix}-${suffix}`);
  }
  return [...codes];
}
