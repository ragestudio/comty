module.exports = {
  siteName: 'Comty',
  copyright: 'RageStudio©',

  LogoPath: '/logo.svg',
  FullLogoPath: '/full_logo.svg',
  DarkFullLogoPath: '/dark_full_logo.svg',
  DarkLogoPath: '/dark_logo.svg',

  resource_bundle: 'light_ng',

  sync_server: 'http://85.251.59.39:6050',
  rest_server: 'https://comty.pw',

  /* Layout configuration, specify which layout to use for route. */
  layouts: [
    {
      name: 'primary',
      include: [/\/main/, /\/settings/, /\/saves/, /\/pro/, /\/chats/, /\//],
      exclude: [/\/publics/, /\/login/ ],
    },
    {
      name: 'public',
      include: [/.*/]
    }
  ],

  i18n: {
    languages: [
      {
        key: 'en',
        title: 'English',
      },
    ],
    defaultLanguage: 'en',
  },
}
