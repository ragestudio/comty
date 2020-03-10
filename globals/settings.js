const ycore = require('ycore')
const fromStorage = JSON.parse(localStorage.getItem('app_settings'))

export var AppSettings = [
    {
        "SettingID": "strict_lightMode",
        "type" : "switch",
        "title": "Strict Light Mode",
        "description": "Force the app to apply full light mode theme when the light mode is activated... (Experimental)",
        "value":  fromStorage? ycore.StorageValued('strict_lightMode') : false
      },
      {
        "SettingID": "default_collapse_sider",
        "type" : "switch",
        "title": "Default Collapse Sider",
        "description": "Force the app to apply collapsed mode theme when the app is mounted...",
        "value":  fromStorage? ycore.StorageValued('default_collapse_sider') : true
      },
      {
        "SettingID": "auto_feedrefresh",
        "type" : "switch",
        "title": "Auto Feed Refresh",
        "description": "Force the app to auto refresh the posts feed when exist news posts for update",
        "value": fromStorage? ycore.StorageValued('auto_feedrefresh') : false 
      },
      {
        "SettingID": "force_showDevLogs",
        "type" : "switch",
        "title": "Show Functions Logs",
        "description": "Show all console logs... [Developer]",
        "value": fromStorage? ycore.StorageValued('force_showDevLogs') : false
      },
      {
        "SettingID": "sessions_noexpire",
        "type" : "switch",
        "title": "No expire session",
        "description": "Force the app to not expire any session... [Developer]",
        "value": fromStorage? ycore.StorageValued('sessions_noexpire') : false
      },
      {
        "SettingID": "auto_search_ontype",
        "type" : "switch",
        "title": "Auto search",
        "description": "Force the app to automaticly search when a type input is detected... [Developer]",
        "value": fromStorage? ycore.StorageValued('auto_search_ontype') : false
      },
      {
        "SettingID": "default_showpostcreator",
        "type" : "switch",
        "title": "Show default Post Creator",
        "description": "Force the app to automaticly search when a type input is detected... [Developer]",
        "value": fromStorage? ycore.StorageValued('default_showpostcreator') : false
      },
      {
        "SettingID": "force_show_postactions",
        "type" : "switch",
        "title": "Not auto hide Posts Actions",
        "description": "Force the app to dont hide the post actions (likes, comments ...etc) automaticly... [Developer]",
        "value": fromStorage? ycore.StorageValued('force_show_postactions') : false
      },
      {
        "SettingID": "use_dev_server",
        "type" : "switch",
        "title": "Use Comty™ Development Server",
        "description": "Force the app to connect to an development server... [High Recomended]",
        "value": fromStorage? ycore.StorageValued('use_dev_server') : false
      },
]
