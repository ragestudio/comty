const fromStorage = JSON.parse(localStorage.getItem('app_settings'))
function StorageValued(e){
  const Ite = fromStorage.map(item => {
    return item.SettingID === e? item.value : null
  })
  const fr = Ite.filter(Boolean)
  return fr.toString()
}
export default [
    {
        "SettingID": "strict_lightMode",
        "title": "Strict Light Mode",
        "description": "Force the app to apply full light mode theme when the light mode is activated... (Experimental)",
        "value":  StorageValued('strict_lightMode') || false
      },
      {
        "SettingID": "force_collapse",
        "title": "Collapsed Default",
        "description": "Force the app to apply collapse mode when an component has updated",
        "value": StorageValued('force_collapse') || false
      },
      {
        "SettingID": "force_showDevLogs",
        "title": "Show Functions Logs",
        "description": "Show all console logs... [Developer]",
        "value": StorageValued('force_showDevLogs') || true
      },
      {
        "SettingID": "sessions_noexpire",
        "title": "No expire session",
        "description": "Force the app to not expire any session... [Developer]",
        "value": StorageValued('sessions_noexpire') || true
      }
]