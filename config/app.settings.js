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
  __global_server_prexif: 'https://api.ragestudio.net/RSA-COMTY/r/',
  // Global Behaviors 
  InfiniteLoading: false,
  InfiniteLogin: false,
  InfiniteRegister: false,
  DisableLogin: false,
  DisableRegister: true,
  DisablePasswordRecover: true,
  disable_pro_tool: fromStorage? SettingStoragedValue('disable_pro_tool') : false,
  force_showDevLogs: fromStorage? SettingStoragedValue('force_showDevLogs') : false,
  SignForNotExpire: fromStorage? SettingStoragedValue('sessions_noexpire') : false,
  auto_search_ontype: fromStorage? SettingStoragedValue('auto_search_ontype') : false,
  auto_feedrefresh: fromStorage? SettingStoragedValue('auto_feedrefresh') : false,
  auto_hide_postbar: fromStorage? SettingStoragedValue('auto_hide_postbar') : true,
  MaxLengthPosts: '512',
  CurrentBundle: 'light_ng',
  // In KB
  MaximunAPIPayload: '101376',
  limit_post_catch: '20',
  Maximun_tick_overrun: 10,
}