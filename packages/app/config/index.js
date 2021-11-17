export default {
  logo: {
    alt: "https://dl.ragestudio.net/branding/comty/alt/SVG/t3t3.svg"
  },
  api: {
    address: process.env.NODE_ENV !== 'production' ? `http://${window.location.hostname}:3000` : "https://api.amimet.es",
  },
  theme: {
    "primary-color": "#32b7bb",
  },
  app: {
    siteName: 'Comty™',
    copyright: 'RageStudio©',
    mainPath: '/main',

    appTheme_desiredContrast: 7,
    // Contrast level AA = 4.5, Level AAA = 7
    // Reference: https://www.w3.org/WAI/WCAG21/quickref/?versions=2.0&showtechniques=143#qr-visual-audio-contrast-contrast
  },
  i18n: {
    languages: [
      {
        key: 'en',
        title: 'English',
      },
    ],
    defaultLanguage: 'en',
  },
  stricts: {
    post_maxlenght: '512',
    // In KB
    api_maxpayload: '101376',
    api_maxovertick: 10,
  }
}
