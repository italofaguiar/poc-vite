import { vi } from 'vitest';
import ptTranslations from './i18n/locales/pt.json';

// Helper to get nested translation value
const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return key if not found
    }
  }

  return typeof current === 'string' ? current : path;
};

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => getNestedValue(ptTranslations, key), // Return actual translation
    i18n: {
      changeLanguage: vi.fn(),
      language: 'pt',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock i18n module to prevent initialization errors
vi.mock('./i18n', () => ({
  default: {
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockResolvedValue(undefined),
    changeLanguage: vi.fn(),
    language: 'pt',
    t: (key: string) => getNestedValue(ptTranslations, key),
  },
}));
