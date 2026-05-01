// src/components/seo/SEOHead.jsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const SITE_URL = 'https://certipractice.app';
export const SITE_NAME = 'CertiPractice';
const OG_IMAGE = `${SITE_URL}/og-image.svg`;

const structuredOrganization = () => ({
  '@context': 'https://schema.org', '@type': 'Organization',
  name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/favicon.png`,
  description: 'Free cloud certification practice exam platform for AWS, Google Cloud, Azure, Databricks and Snowflake.',
});

const structuredWebSite = () => ({
  '@context': 'https://schema.org', '@type': 'WebSite',
  name: SITE_NAME, url: SITE_URL, inLanguage: ['en', 'es'],
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
});

const structuredCourse = ({ certificationName, certificationCode, provider, description }) => ({
  '@context': 'https://schema.org', '@type': 'Course',
  name: `${certificationName} Practice Exam`,
  description: description || `Free practice questions for the ${certificationName} certification.`,
  provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  teaches: certificationName,
  educationalCredentialAwarded: certificationCode || certificationName,
  courseMode: 'online', isAccessibleForFree: true, inLanguage: ['en', 'es'],
  about: { '@type': 'Thing', name: provider || 'Cloud Computing' },
});

const structuredQuiz = ({ examName, certification, provider }) => ({
  '@context': 'https://schema.org', '@type': 'Quiz',
  name: examName || `${certification} Practice Exam`,
  about: { '@type': 'Thing', name: certification || 'Cloud Certification' },
  isAccessibleForFree: true,
  provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
});

const structuredBreadcrumb = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem', position: i + 1, name: item.name, item: item.url,
  })),
});

const FAQ_DATA = [
  { q: 'Is CertiPractice free?', a: 'Yes, completely free. Take full practice exams without creating an account. Register to save progress and access Failed Questions mode and exam history.' },
  { q: 'Which certifications does CertiPractice support?', a: 'AWS (SAA-C03, DVA-C02, SOA-C02 and more), Google Cloud (Professional Cloud Architect, Data Engineer, ML Engineer), Microsoft Azure (AZ-900, AZ-104, AZ-204, AZ-305), Databricks (Data Engineer, ML Professional) and Snowflake.' },
  { q: 'How are practice questions created?', a: 'Questions are curated from real exam experiences, official documentation and community contributions. Each includes a detailed explanation of the correct answer.' },
  { q: 'Can I track my progress?', a: 'Yes. Create a free account to track exam history, see scores per certification, identify weak areas with Failed Questions mode, and monitor improvement over time.' },
  { q: 'What exam modes are available?', a: 'Three modes: Real Exam Simulation (timed, no aids), Practice Mode (instant verification and explanations), and Failed Questions Mode (focus on previously wrong answers).' },
];

const structuredFAQ = () => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ_DATA.map(({ q, a }) => ({
    '@type': 'Question', name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});

const PROVIDER_KEYWORDS = {
  'AWS': 'AWS certification practice, AWS exam questions, SAA-C03 practice test, DVA-C02 questions, AWS Solutions Architect exam, AWS Developer exam, free AWS practice exam',
  'Google Cloud': 'Google Cloud certification practice, GCP exam questions, Professional Cloud Architect practice, Data Engineer exam, GCP practice test, free Google Cloud exam',
  'Microsoft Azure': 'Azure certification practice, AZ-900 practice test, AZ-104 questions, Azure fundamentals exam, Microsoft Azure practice, free Azure exam questions',
  'Databricks': 'Databricks certification practice, Databricks Data Engineer exam, Databricks ML Professional, Delta Lake exam questions, free Databricks practice test',
  'Snowflake': 'Snowflake certification practice, SnowPro Core exam, Snowflake Data Engineer practice, free Snowflake exam questions',
};

const BASE_KEYWORDS = 'cloud certification practice exam, free certification practice, exam preparation, certification questions, practice test';

const setMeta = (attr, attrVal, content) => {
  let el = document.querySelector(`meta[${attr}="${attrVal}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, attrVal); document.head.appendChild(el); }
  el.setAttribute('content', content);
};

const setLink = (rel, href) => {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
};

const upsertJsonLd = (id, data) => {
  let el = document.querySelector(`script[data-seo-id="${id}"]`);
  if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.setAttribute('data-seo-id', id); document.head.appendChild(el); }
  el.textContent = JSON.stringify(data);
};

export default function SEOHead({
  pageType = 'home', title, description, keywords, canonical,
  provider, certification, certificationCode, examName, noIndex = false,
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';

  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Free Cloud Certification Practice Exams`;

  const resolvedDescription = description || (
    provider && certification
      ? `Free ${certification}${certificationCode ? ` (${certificationCode})` : ''} practice exam. Real questions with detailed explanations. Prepare for your ${provider} certification today.`
      : provider
      ? `Free ${provider} certification practice exams. Real questions with instant explanations. Prepare for your ${provider} certification today.`
      : 'Practice for AWS, Google Cloud, Azure, Databricks and Snowflake certifications with thousands of real questions. Instant explanations, progress tracking, and exam simulations. 100% free.'
  );

  const resolvedKeywords = keywords || (provider ? `${PROVIDER_KEYWORDS[provider] || ''}, ${BASE_KEYWORDS}` : BASE_KEYWORDS);
  const resolvedCanonical = canonical || `${SITE_URL}/`;

  useEffect(() => {
    document.title = fullTitle;
    document.documentElement.lang = lang;

    setMeta('name', 'description', resolvedDescription);
    setMeta('name', 'keywords', resolvedKeywords);
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');
    setMeta('name', 'author', SITE_NAME);

    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', resolvedDescription);
    setMeta('property', 'og:url', resolvedCanonical);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:image', OG_IMAGE);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt', `${SITE_NAME} – Cloud Certification Practice`);
    setMeta('property', 'og:locale', lang === 'es' ? 'es_ES' : 'en_US');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', resolvedDescription);
    setMeta('name', 'twitter:image', OG_IMAGE);
    setMeta('name', 'twitter:site', '@certipractice');

    setLink('canonical', resolvedCanonical);

    upsertJsonLd('org', structuredOrganization());
    upsertJsonLd('website', structuredWebSite());

    if (pageType === 'home') upsertJsonLd('faq', structuredFAQ());

    if ((pageType === 'certification' || pageType === 'provider') && provider) {
      upsertJsonLd('course', structuredCourse({ certificationName: certification || `${provider} Certification`, certificationCode, provider, description: resolvedDescription }));
      const crumbs = [{ name: SITE_NAME, url: SITE_URL }];
      if (provider) crumbs.push({ name: provider, url: `${SITE_URL}/?provider=${encodeURIComponent(provider)}` });
      if (certification) crumbs.push({ name: certification, url: resolvedCanonical });
      upsertJsonLd('breadcrumb', structuredBreadcrumb(crumbs));
    }

    if (pageType === 'exam') upsertJsonLd('quiz', structuredQuiz({ examName, certification, provider }));
  }, [fullTitle, resolvedDescription, resolvedKeywords, resolvedCanonical, pageType, provider, certification, certificationCode, examName, noIndex, lang]);

  return null;
}

export const SEO_CONFIGS = {
  home: { pageType: 'home' },
  aws: { pageType: 'provider', provider: 'AWS', title: 'AWS Certification Practice Exams – Free Questions', description: 'Prepare for AWS certifications with thousands of real practice questions. SAA-C03, DVA-C02, SOA-C02, MLS-C01 and more. Instant explanations included.' },
  gcp: { pageType: 'provider', provider: 'Google Cloud', title: 'Google Cloud Certification Practice Exams – Free Questions', description: 'Prepare for Google Cloud certifications with real practice questions. Professional Cloud Architect, Data Engineer, ML Engineer and more.' },
  azure: { pageType: 'provider', provider: 'Microsoft Azure', title: 'Microsoft Azure Certification Practice Exams – Free Questions', description: 'Prepare for Azure certifications with real practice questions. AZ-900, AZ-104, AZ-204, AZ-305 and more.' },
  databricks: { pageType: 'provider', provider: 'Databricks', title: 'Databricks Certification Practice Exams – Free Questions', description: 'Prepare for Databricks certifications with real practice questions. Data Engineer, ML Professional and more.' },
  snowflake: { pageType: 'provider', provider: 'Snowflake', title: 'Snowflake Certification Practice Exams – Free Questions', description: 'Prepare for Snowflake certifications with real practice questions. SnowPro Core, Data Engineer and more.' },
};
