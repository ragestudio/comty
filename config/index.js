module.exports = {
  app_config: {
    guid: "7d6b74b5-1b3b-432f-97df-2c5fc2c2b6ae",
    siteName: 'Comty™',
    copyright: 'RageStudio©',
    MainPath: '/',
    
    LogoPath: '/logo.svg',
    FullLogoPath: '/full_logo.svg',
    DarkFullLogoPath: '/dark_full_logo.svg',
    DarkLogoPath: '/dark_logo.svg',

    endpoint_v3prefix: 'ycorejs_apiv3',
    endpoint_websocket: 'eu_es01.ragestudio.net',
    
    storage_appSettings: 'app_settings', 
    storage_authFrame: 'cid',
    storage_dataFrame: 'data',
    storage_theme: 'app_theme',
    
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

  layouts: [
    {
      name: 'primary',
      include: [/\/main/, /\/settings/, /\/saves/, /\/pro/, /\/chats/, /\//],
      exclude: [/\/publics/, /\/login/ ],
    },
    {
      name: 'public',
      include: [/.*/]
    },
    {
      name: 'splash',
      include: [/\/splash/]
    },
  ],
  
  // Default Behaviors 
  defaults: {
        app_model: "app",
        verbosity: false,
        session_noexpire: false,
        search_ontype: false,
        post_autoposition: true,
        overlay_loosefocus: true,
        render_pagetransition_preset: 'moveToRightScaleUp',
        post_catchlimit: '20',
        post_hidebar: true,

        feed_autorefresh: false,
        keybinds: {
          nextElement: "J",
          prevElement: "U",
          createNew: "N"
        }
  },

  stricts: {
    post_maxlenght: '512',
    // In KB
    api_maxpayload: '101376',
    api_maxovertick: 10,
  }
  
};
