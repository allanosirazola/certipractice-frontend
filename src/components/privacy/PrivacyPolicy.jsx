// src/components/privacy/PrivacyPolicy.jsx
import { useTranslation } from 'react-i18next';
import SettingsPanel from '../common/SettingsPanel';
import SEOHead from '../seo/SEOHead';

export default function PrivacyPolicy({ onBack, onOpenCookies }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';

  const content = lang === 'es' ? {
    title: 'Política de Privacidad',
    lastUpdated: 'Última actualización: 1 de mayo de 2026',
    intro: 'En CertiPractice nos tomamos en serio tu privacidad. Esta política explica qué datos recopilamos, cómo los usamos y qué derechos tienes.',
    sections: [
      {
        title: '1. Información que recopilamos',
        body: [
          'Datos de cuenta (si te registras): nombre, email, contraseña encriptada, idioma preferido.',
          'Datos de uso: exámenes realizados, puntuaciones, preguntas falladas, tiempo de actividad.',
          'Datos técnicos: dirección IP, tipo de navegador, sistema operativo, tipo de dispositivo.',
          'Cookies y tecnologías similares (ver sección de cookies más abajo).'
        ]
      },
      {
        title: '2. Cómo usamos tus datos',
        body: [
          'Para proporcionarte el servicio: guardar tu progreso, mostrar tu historial, calcular estadísticas.',
          'Para mejorar la plataforma: análisis agregados de uso (solo si aceptas las cookies analíticas).',
          'Para mostrarte anuncios relevantes a través de Google AdSense (solo si aceptas las cookies publicitarias).',
          'Para comunicarnos contigo sobre actualizaciones importantes del servicio.'
        ]
      },
      {
        title: '3. Cookies y publicidad',
        body: [
          'Usamos cookies necesarias para el funcionamiento del sitio (sesión, idioma).',
          'Usamos cookies funcionales para recordar tus preferencias.',
          'Si lo aceptas, usamos cookies analíticas para entender cómo se usa CertiPractice.',
          'Si lo aceptas, usamos Google AdSense para mostrar anuncios relevantes. Google puede usar cookies y datos para personalizar los anuncios. Más información en https://policies.google.com/privacy.',
          'Puedes cambiar tus preferencias en cualquier momento desde Ajustes ⚙ > Preferencias de cookies.'
        ]
      },
      {
        title: '4. Compartición de datos',
        body: [
          'No vendemos tus datos personales a terceros.',
          'Compartimos datos con proveedores que nos ayudan a operar el servicio: hosting (Vercel), base de datos, AdSense (solo si lo aceptas).',
          'Podemos divulgar datos si la ley lo requiere.'
        ]
      },
      {
        title: '5. Tus derechos (GDPR)',
        body: [
          'Acceso: puedes solicitar una copia de los datos que tenemos sobre ti.',
          'Rectificación: puedes corregir datos inexactos desde tu perfil.',
          'Supresión: puedes eliminar tu cuenta y todos los datos asociados.',
          'Portabilidad: puedes solicitar tus datos en formato exportable.',
          'Oposición: puedes oponerte a determinados procesamientos.',
          'Para ejercer estos derechos, contacta con privacy@certipractice.app.'
        ]
      },
      {
        title: '6. Seguridad',
        body: [
          'Las contraseñas se almacenan con bcrypt.',
          'Las conexiones usan HTTPS/TLS.',
          'El acceso a la base de datos está restringido y monitorizado.'
        ]
      },
      {
        title: '7. Menores de edad',
        body: [
          'CertiPractice no está dirigido a menores de 16 años. Si descubres que un menor nos ha proporcionado datos sin consentimiento parental, contáctanos para eliminarlos.'
        ]
      },
      {
        title: '8. Cambios en esta política',
        body: [
          'Podemos actualizar esta política. Notificaremos los cambios significativos por email o mediante aviso en el sitio.'
        ]
      },
      {
        title: '9. Contacto',
        body: [
          'Para cualquier consulta sobre privacidad, contacta con privacy@certipractice.app.'
        ]
      }
    ],
    cookieButton: 'Gestionar preferencias de cookies',
    backButton: '← Volver'
  } : {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: 1 May 2026',
    intro: 'At CertiPractice we take your privacy seriously. This policy explains what data we collect, how we use it, and what rights you have.',
    sections: [
      {
        title: '1. Information we collect',
        body: [
          'Account data (if you register): name, email, encrypted password, language preference.',
          'Usage data: exams taken, scores, failed questions, activity time.',
          'Technical data: IP address, browser type, operating system, device type.',
          'Cookies and similar technologies (see cookies section below).'
        ]
      },
      {
        title: '2. How we use your data',
        body: [
          'To provide the service: save your progress, show your history, calculate statistics.',
          'To improve the platform: aggregate usage analytics (only if you accept analytics cookies).',
          'To show relevant ads via Google AdSense (only if you accept advertising cookies).',
          'To communicate with you about important service updates.'
        ]
      },
      {
        title: '3. Cookies and advertising',
        body: [
          'We use necessary cookies for site operation (session, language).',
          'We use functional cookies to remember your preferences.',
          'If you accept, we use analytics cookies to understand how CertiPractice is used.',
          'If you accept, we use Google AdSense to show relevant ads. Google may use cookies and data to personalise ads. More information at https://policies.google.com/privacy.',
          'You can change your preferences anytime from Settings ⚙ > Cookie preferences.'
        ]
      },
      {
        title: '4. Data sharing',
        body: [
          'We do not sell your personal data to third parties.',
          'We share data with providers who help us operate the service: hosting (Vercel), database, AdSense (only if you accept).',
          'We may disclose data if required by law.'
        ]
      },
      {
        title: '5. Your rights (GDPR)',
        body: [
          'Access: you can request a copy of the data we hold about you.',
          'Rectification: you can correct inaccurate data from your profile.',
          'Deletion: you can delete your account and all associated data.',
          'Portability: you can request your data in an exportable format.',
          'Objection: you can object to certain processing.',
          'To exercise these rights, contact privacy@certipractice.app.'
        ]
      },
      {
        title: '6. Security',
        body: [
          'Passwords are stored using bcrypt.',
          'Connections use HTTPS/TLS.',
          'Database access is restricted and monitored.'
        ]
      },
      {
        title: '7. Minors',
        body: [
          'CertiPractice is not directed to children under 16. If you discover a minor has provided us data without parental consent, contact us to delete it.'
        ]
      },
      {
        title: '8. Changes to this policy',
        body: [
          'We may update this policy. We will notify significant changes by email or via on-site notice.'
        ]
      },
      {
        title: '9. Contact',
        body: [
          'For any privacy queries, contact privacy@certipractice.app.'
        ]
      }
    ],
    cookieButton: 'Manage cookie preferences',
    backButton: '← Back'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 transition-colors">
      <SEOHead
        pageType="page"
        title={content.title}
        description={content.intro}
        canonical="https://certipractice.vercel.app/privacy"
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
          >
            {content.backButton}
          </button>
          <SettingsPanel onOpenCookies={onOpenCookies} />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {content.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{content.lastUpdated}</p>

          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8 text-lg">
            {content.intro}
          </p>

          <div className="space-y-8">
            {content.sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                  {section.title}
                </h2>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {section.body.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-500 dark:text-blue-400 mt-1.5 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Cookie management CTA */}
          <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={onOpenCookies}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {content.cookieButton}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
