// src/components/community/CommunityPage.jsx
// Page-mode wrapper around the CommunityForum modal
import CommunityForum from './CommunityForum';
import SettingsPanel from '../common/SettingsPanel';
import SEOHead from '../seo/SEOHead';
import { useTranslation } from 'react-i18next';

export default function CommunityPage({ onBack, onOpenCookies, onOpenPrivacy }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 transition-colors">
      <SEOHead pageType="page" title={t('community.title')} description={t('community.subtitle')} />

      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
          >
            {t('community.backToHome')}
          </button>
          <SettingsPanel onOpenCookies={onOpenCookies} onOpenPrivacy={onOpenPrivacy} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Render the forum inline (not as overlay) */}
        <div className="community-page-mode">
          <CommunityForum onClose={onBack} />
        </div>
      </main>

      <style>{`
        /* Override the forum's modal styling to render as a full-page card */
        .community-page-mode > .fixed {
          position: relative !important;
          background: transparent !important;
          padding: 0 !important;
          inset: auto !important;
        }
        .community-page-mode > .fixed > div {
          max-height: none !important;
        }
      `}</style>
    </div>
  );
}
