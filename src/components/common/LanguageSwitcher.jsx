import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(next);
  };

  const isSpanish = i18n.language.startsWith('es');

  return (
    <button
      onClick={toggleLanguage}
      title={isSpanish ? t('lang.en') : t('lang.es')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium
        transition-colors bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300
        ${className}`}
    >
      <span className="text-base leading-none">{isSpanish ? '🇬🇧' : '🇪🇸'}</span>
      <span>{isSpanish ? 'EN' : 'ES'}</span>
    </button>
  );
}
