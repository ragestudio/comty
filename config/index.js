module.exports = {
  app_config: {
    siteName: 'Comty',
    copyright: 'RageStudio©',
    MainPath: '/',

    LogoPath: '/logo.svg',
    FullLogoPath: '/full_logo.svg',
    DarkFullLogoPath: '/dark_full_logo.svg',
    DarkLogoPath: '/dark_logo.svg',

    api_prefix: 'ycorejs_apiv3',
    app_settings_storage: 'app_settings' 
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

  // Default Behaviors 
  defaults: {
        verbosity: false,
        session_noexpire: false,
        search_ontype: false,
        overlay_loosefocus: true,
        render_pagetransition_preset: 'moveToRightScaleUp',

        feed_autorefresh: false,

        post_maxlenght: '512',
        post_catchlimit: '20',
        post_hidebar: true,

        // In KB
        api_maxpayload: '101376',
        api_maxovertick: 10,
  }
  
};
