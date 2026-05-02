# CertiPractice — Frontend 🎓

Plataforma de práctica para certificaciones cloud (AWS, Google Cloud, Azure, Databricks, Snowflake, HashiCorp y Salesforce). Gratuita, con miles de preguntas curadas, modo realista, modo práctica con explicaciones y modo "preguntas falladas" para repasar errores.

> **Stack:** React 18 · Vite 5 · Tailwind 3 · i18next · jsPDF · Vitest · Testing Library

## ✨ Características principales

- 🔐 **Sistema de autenticación** con sesiones anónimas para invitados
- 🎯 **Tres modos de examen**: Práctica (con explicaciones), Real (cronometrado, sin pistas) y Preguntas Falladas (repaso de errores)
- 📜 **Historial de exámenes** con resultados detallados y estadísticas por categoría
- 📄 **Informe PDF profesional** con marca, gráficas y desglose listo para presentar a un manager
- 🌗 **Modo claro/oscuro** persistente por usuario
- 🌐 **Internacionalización** completa (es / en) con detección automática
- 🍪 **Banner GDPR/ePrivacy** con preferencias granulares de cookies
- 💬 **Foro de comunidad** integrado
- 🎨 **61 logos SVG locales** de certificación generados desde un registro único de verdad

## 🚀 Instalación rápida

```bash
git clone https://github.com/allanosirazola/certipractice-frontend.git
cd certipractice-frontend
npm install
cp .env.example .env.local       # Edita VITE_API_URL si tu backend no es local
npm run dev                      # → http://localhost:5173
```

## 📜 Scripts disponibles

| Comando                | Descripción                                             |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo con HMR (puerto 5173)            |
| `npm run build`        | Build de producción optimizado en `dist/`               |
| `npm run preview`      | Sirve el build de producción localmente                 |
| `npm run lint`         | ESLint en todos los archivos `.js`/`.jsx`               |
| `npm test`             | Vitest en modo watch                                    |
| `npm run test:run`     | Vitest una sola pasada (CI)                             |
| `npm run test:coverage`| Genera informe de cobertura                             |
| `npm run gen:logos`    | Regenera los SVGs de certificación a partir del registro |

## 🌐 Variables de entorno

Definir en `.env.local` (no entran en git). Ver `.env.example`.

| Variable        | Por defecto                                                  | Descripción          |
| --------------- | ------------------------------------------------------------ | -------------------- |
| `VITE_API_URL`  | `https://certipractice-backend-production.up.railway.app`    | URL del backend REST |

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── LandingExamenes.jsx       # Página principal: selector de proveedor / cert / modo
│   ├── ExamenView.jsx            # Vista del examen en curso
│   ├── auth/                     # Login, Register
│   ├── ads/                      # AdBreak entre preguntas, AdSense slots
│   ├── common/
│   │   ├── ErrorBoundary.jsx     # Captura errores de render → fallback amigable
│   │   ├── CertificationLogo.jsx # Logos con cascada cert→provider→iniciales
│   │   └── SettingsPanel.jsx     # Idioma · tema · cookies · comunidad
│   ├── community/                # Foro de comunidad
│   ├── exam/                     # ExamReview, ExamHistory, ExamModeSelector,
│   │                             # ExamExitModal, FailedQuestionsStats, QuestionReportModal
│   ├── privacy/                  # PrivacyPolicy, CookieConsentBanner, PrivacyControlPanel
│   ├── seo/                      # SEOHead (document.title, meta dinámicos)
│   └── user/                     # UserProfile
├── context/
│   ├── AuthContext.jsx           # JWT auth + sesión anónima
│   └── ThemeContext.jsx          # Modo oscuro persistente
├── data/
│   ├── certificaciones.js        # Catálogo legacy (en migración a backend)
│   └── certRegistry.js           # ⭐ Fuente única de verdad: 61 certs locales
├── i18n/
│   ├── index.js                  # Configuración i18next
│   └── locales/{es,en}.json      # Traducciones
├── services/
│   └── api.js                    # Cliente REST con manejo de timeout/auth
├── utils/
│   ├── generateExamReport.js     # Generador de PDF profesional
│   └── logger.js                 # Logger respetando DEBUG flag
├── tests/                        # 360+ tests (Vitest)
└── App.jsx                       # Routing por hash + lazy loading + ErrorBoundary

public/
└── images/
    ├── certifications/           # 61 SVGs generados (gen:logos)
    └── *-logo.png                # Logos de proveedor

scripts/
└── generate-cert-logos.mjs       # Genera SVGs leyendo certRegistry.js
```

## 🧪 Tests

Cobertura: **18 archivos**, **360+ tests**, **100% verde**.

```bash
npm run test:run           # Una sola pasada
npm run test:coverage      # Con cobertura (se imprime en terminal + html en coverage/)
```

Los tests usan un mock de i18next bilingüe controlable por test:
```js
beforeEach(() => globalThis.__setTestLang('en'));   // o 'es'
```

## ⚡ Optimizaciones de bundle

El bundle inicial está dividido en chunks cacheables independientes mediante `vite.config.js`:

| Chunk             | Tamaño (gzip) | Cuándo se carga                |
| ----------------- | ------------- | ------------------------------ |
| `index`           | ~24 KB        | Siempre (entry)                |
| `react-vendor`    | ~45 KB        | Siempre (cacheable larga vida) |
| `i18n`            | ~21 KB        | Siempre                        |
| `LandingExamenes` | ~16 KB        | Lazy: vista home               |
| `ExamenView`      | ~13 KB        | Lazy: examen activo            |
| `ExamReview`      | ~10 KB        | Lazy: revisión                 |
| `CommunityPage`   | ~4 KB         | Lazy: foro                     |
| `PrivacyPolicy`   | ~4 KB         | Lazy: política                 |
| `pdf` (jsPDF)     | ~129 KB       | Solo al descargar el informe   |

## 🎨 Añadir una nueva certificación con logo

1. Añade la entrada en [`src/data/certRegistry.js`](src/data/certRegistry.js):
   ```js
   { code: 'NEW-101', provider: 'AWS', glyph: 'developer', tag: 'New Cert' },
   ```
2. Regenera los SVGs:
   ```bash
   npm run gen:logos
   ```
3. El componente `CertificationLogo` lo recoge automáticamente.

## 🔐 Seguridad

- `npm audit` se ejecuta sin vulnerabilidades en producción. Las 2 advertencias residuales (`esbuild`/`vite`) afectan solo al **dev server**, no al build.
- El logger nunca expone tokens; los errores se canalizan por `src/utils/logger.js` y respetan el flag `config.DEBUG`.
- `<ErrorBoundary>` envuelve toda la app: un error de render en una vista no rompe el resto.

## 📜 Licencia

Privada — © CertiPractice 2025
