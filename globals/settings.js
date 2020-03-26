const fromStorage = JSON.parse(localStorage.getItem('app_settings'))

function SettingStoragedValue(e) {
  try {
    const fromStorage = JSON.parse(localStorage.getItem('app_settings'))
    const Ite = fromStorage.map(item => {
      return item.SettingID === e ? item.value : null
    })
    const fr = Ite.filter(Boolean)
    return fr.toString()
  } catch (error) {
    return null
  }
}

export var ListSettings = [
  {
    SettingID: 'sessions_noexpire',
    type: 'switch',
    title: 'No expire session',
    description: 'Force the app to not expire any session... [Developer]',
    value: fromStorage ? SettingStoragedValue('sessions_noexpire') : false,
  },
  {
    SettingID: 'auto_feedrefresh',
    type: 'switch',
    title: 'Auto Feed Refresh',
    description:
      'Force the app to auto refresh the posts feed when exist news posts for update',
    value: fromStorage ? SettingStoragedValue('auto_feedrefresh') : false,
  },
  {
    SettingID: 'auto_search_ontype',
    type: 'switch',
    title: 'Detect input on search bar',
    description:
      'Force the app to automaticly search when a type input is detected... [Developer]',
    value: fromStorage ? SettingStoragedValue('auto_search_ontype') : false,
  },
  {
    SettingID: 'auto_hide_postbar',
    type: 'switch',
    title: 'Auto hide postbar',
    description:
      'Force the app to dont hide the post actions (likes, comments ...etc) automaticly... [Developer]',
    value: fromStorage ? SettingStoragedValue('auto_hide_postbar') : true,
  },
  {
    SettingID: 'force_showDevLogs',
    type: 'switch',
    title: 'Show Functions Logs',
    description: 'Show all console logs... [Developer]',
    value: fromStorage ? SettingStoragedValue('force_showDevLogs') : false,
  },
]
