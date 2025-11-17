import { useTranslation } from 'react-i18next';

/**
 * Language toggle component
 * Allows users to switch between Portuguese and English
 */
export function LanguageToggle() {
  const { i18n } = useTranslation();
  // Extract base language (pt-BR -> pt, en-US -> en)
  const currentLang = i18n.language.split('-')[0];

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center gap-1 bg-app-secondary dark:bg-dark-app-secondary border border-app-primary dark:border-dark-app-primary rounded-md p-1">
      <button
        onClick={() => changeLanguage('pt')}
        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
          currentLang === 'pt'
            ? 'bg-primary text-white'
            : 'text-app-secondary dark:text-dark-app-secondary hover:text-app-primary dark:hover:text-dark-app-primary'
        }`}
        aria-label="Mudar idioma para Português"
        title="Português"
      >
        PT
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
          currentLang === 'en'
            ? 'bg-primary text-white'
            : 'text-app-secondary dark:text-dark-app-secondary hover:text-app-primary dark:hover:text-dark-app-primary'
        }`}
        aria-label="Change language to English"
        title="English"
      >
        EN
      </button>
    </div>
  );
}
