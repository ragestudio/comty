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
    app_settings_storage: 'app_settings', 

    session_token_storage: 'cid',
    session_data_storage: 'data',
    
    appTheme_container: 'app_theme',
    appTheme_desiredContrast: 4.5,
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
  },

  stricts: {
    post_maxlenght: '512',
    post_catchlimit: '20',
    post_hidebar: true,

    // In KB
    api_maxpayload: '101376',
    api_maxovertick: 10,
  }
  
};
