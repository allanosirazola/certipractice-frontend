// src/components/ads/AdBreak.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// ─── AdSense config ──────────────────────────────────────────────────────────
// Replace with your real publisher ID and slot IDs from your AdSense account
export const ADSENSE_PUBLISHER_ID = 'ca-pub-1098845223790619';
export const AD_SLOTS = {
  start:  '1234567890',   // Start-of-exam ad slot
  finish: '0987654321',   // Pre-results ad slot
};

// ─── Inject AdSense script once ──────────────────────────────────────────────
let adsenseInjected = false;
function ensureAdsenseScript() {
  if (adsenseInjected || document.querySelector('script[data-adsense]')) {
    adsenseInjected = true;
    return;
  }
  // Script already injected via index.html — just mark as done
  if (document.querySelector('script[src*="adsbygoogle"]')) {
    adsenseInjected = true;
    return;
  }
  const s = document.createElement('script');
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.setAttribute('data-adsense', 'true');
  document.head.appendChild(s);
  adsenseInjected = true;
}

// ─── Single ad slot ───────────────────────────────────────────────────────────
function AdSlot({ slot, phase }) {
  const ref = useRef(null);
  const pushed = useRef(false);
  const hasSlot = slot && !slot.startsWith('0000') && slot !== '1234567890' && slot !== '0987654321';

  useEffect(() => {
    if (!hasSlot || pushed.current || !ref.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {}
  }, [hasSlot]);

  if (!hasSlot) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center py-14 px-8 text-slate-400 select-none">
        <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
        </svg>
        <span className="text-sm font-medium tracking-widest uppercase">Advertisement</span>
        <span className="text-xs mt-1 opacity-60">Set AD_SLOTS.{phase} in AdBreak.jsx</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full overflow-hidden rounded-2xl">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ─── Main AdBreak component ───────────────────────────────────────────────────
const COUNTDOWN = 5;       // Total countdown seconds
const SKIP_AFTER = 3;      // Seconds before skip is enabled

const PHASE_COPY = {
  start: {
    icon: '🚀',
    titleKey: 'ads.startTitle',
    subtitleKey: 'ads.startSubtitle',
    accentColor: 'from-blue-600 to-indigo-700',
    ringColor: 'ring-blue-400',
    badgeColor: 'bg-blue-600',
    progressColor: 'bg-blue-500',
  },
  finish: {
    icon: '🏁',
    titleKey: 'ads.finishTitle',
    subtitleKey: 'ads.finishSubtitle',
    accentColor: 'from-emerald-600 to-teal-700',
    ringColor: 'ring-emerald-400',
    badgeColor: 'bg-emerald-600',
    progressColor: 'bg-emerald-500',
  },
};

export default function AdBreak({ phase = 'start', onComplete }) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(COUNTDOWN);
  const [canSkip, setCanSkip] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const intervalRef = useRef(null);
  const copy = PHASE_COPY[phase] || PHASE_COPY.start;
  const slot = AD_SLOTS[phase] || AD_SLOTS.start;

  useEffect(() => {
    ensureAdsenseScript();
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1;
        if (next <= COUNTDOWN - SKIP_AFTER) setCanSkip(true);
        if (next <= 0) {
          clearInterval(intervalRef.current);
          onComplete();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    if (!canSkip) return;
    clearInterval(intervalRef.current);
    setSkipping(true);
    setTimeout(onComplete, 300);
  }, [canSkip, onComplete]);

  const progress = ((COUNTDOWN - countdown) / COUNTDOWN) * 100;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950 transition-opacity duration-300 ${skipping ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br ${copy.accentColor} opacity-10 blur-3xl`} />
        <div className={`absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr ${copy.accentColor} opacity-10 blur-3xl`} />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Header card */}
        <div className={`bg-gray-900 border border-gray-800 rounded-3xl p-6 mb-4 shadow-2xl`}>
          <div className="flex items-center justify-between mb-5">
            {/* Icon + title */}
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${copy.accentColor} flex items-center justify-center text-xl shadow-lg`}>
                {copy.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">
                  {t(copy.titleKey, { defaultValue: phase === 'start' ? 'Exam ready!' : 'Calculating results…' })}
                </p>
                <p className="text-gray-400 text-xs leading-tight mt-0.5">
                  {t(copy.subtitleKey, { defaultValue: 'A short message from our sponsors' })}
                </p>
              </div>
            </div>

            {/* Countdown ring + skip */}
            <div className="flex items-center gap-3">
              {/* SVG countdown ring */}
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#374151" strokeWidth="3"/>
                  <circle
                    cx="24" cy="24" r="20" fill="none"
                    stroke="url(#ringGrad)" strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#60a5fa"/>
                      <stop offset="100%" stopColor="#818cf8"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm tabular-nums">
                  {countdown}
                </span>
              </div>

              {/* Skip button */}
              <button
                onClick={handleSkip}
                disabled={!canSkip}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  canSkip
                    ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg cursor-pointer'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                {canSkip
                  ? t('ads.skip', { defaultValue: 'Skip →' })
                  : t('ads.skipIn', { count: Math.max(0, SKIP_AFTER - (COUNTDOWN - countdown)), defaultValue: `Skip in ${Math.max(0, SKIP_AFTER - (COUNTDOWN - countdown))}s` })
                }
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${copy.progressColor} rounded-full transition-all duration-1000 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Ad slot */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className={`${copy.badgeColor} text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md`}>
              Ad
            </span>
            <span className="text-gray-600 text-xs">Sponsored content</span>
          </div>
          <AdSlot slot={slot} phase={phase} />
        </div>

        {/* Fine print */}
        <p className="text-center text-gray-700 text-xs mt-3">
          {t('ads.disclaimer', { defaultValue: 'Ads help keep CertiPractice free for everyone.' })}
        </p>
      </div>
    </div>
  );
}
