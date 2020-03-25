function SettingStoragedValue(e){
  try {
      const fromStorage = JSON.parse(localStorage.getItem('app_settings'))
      const Ite = fromStorage.map(item => {
        return item.SettingID === e? item.value : null
      })
      const fr = Ite.filter(Boolean)
      return fr.toString()
    } 
    catch (error) {
      return null
    }
}
const fromStorage = JSON.parse(localStorage.getItem('app_settings'))

export var AppSettings = {
  // Global Behaviors 
  InfiniteLoading: false,
  InfiniteLogin: false,
  InfiniteRegister: false,
  DisableLogin: false,
  DisableRegister: true,
  DisablePasswordRecover: true,
  // Activating this, the logs must be trowed
  force_showDevLogs: fromStorage? SettingStoragedValue('force_showDevLogs') : false,
  StrictLightMode: fromStorage? SettingStoragedValue('strict_lightMode') : false,
  SignForNotExpire: fromStorage? SettingStoragedValue('sessions_noexpire') : false,
  auto_search_ontype: fromStorage? SettingStoragedValue('auto_search_ontype') : false,
  auto_feedrefresh: fromStorage? SettingStoragedValue('auto_feedrefresh') : false,
  default_showpostcreator: fromStorage? SettingStoragedValue('default_showpostcreator') : false,
  default_collapse_sider: fromStorage? SettingStoragedValue('default_collapse_sider') : true,
  force_show_postactions: fromStorage? SettingStoragedValue('force_show_postactions') : false,
  MaxLengthPosts: '512',
  CurrentBundle: 'light_ng',
  // In KB
  MaximunAPIPayload: '101376',
  limit_post_catch: '20'
}