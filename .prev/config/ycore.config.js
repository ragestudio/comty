module.exports = {
  server_endpoint: 'https://comty.julioworld.club',
  siteName: 'Comty',
  copyright: 'RageStudio©',

  LogoPath: '/logo.svg',
  FullLogoPath: '/full_logo.svg',
  DarkFullLogoPath: '/dark_full_logo.svg',
  DarkLogoPath: '/dark_logo.svg',

  resource_bundle: 'light_ng',
  sync_server: 'http://eu653-node.ragestudio.net:5500',

  g_recaptcha_key: '6Lc55uUUAAAAAEIACMVf3BUzAJSNCmI3RrjEirZ6',
  g_recaptcha_secret: '6Lc55uUUAAAAAOP4OgUa5DpqJC-70t53AmW0lyYf',

  /* Layout configuration, specify which layout to use for route. */
  layouts: [
    {
      name: 'primary',
      include: [/.*/],
      exclude: [/\/login/, /\/socket\/(.*)/, /\/publics/, /\/authorize/],
    },
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
