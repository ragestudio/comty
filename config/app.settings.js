import {ReturnDevOption} from 'ycore'
export var DevOptions = {
    // Global Behaviors 
    InfiniteLoading: false,
    InfiniteLogin: false,
    InfiniteRegister: false,
    DisableLogin: false,
    DisableRegister: true,
    DisablePasswordRecover: true,
    // Activating this, the logs must be trowed
    ShowFunctionsLogs: ReturnDevOption('force_showDevLogs'),
    StrictLightMode: ReturnDevOption('strict_lightMode'),
    SignForNotExpire: ReturnDevOption('sessions_noexpire'),
    auto_search_ontype: ReturnDevOption('auto_search_ontype'),
    auto_feedrefresh: ReturnDevOption('auto_feedrefresh'),
    default_showpostcreator: ReturnDevOption('default_showpostcreator'),
    default_collapse_sider: ReturnDevOption('default_collapse_sider'),
    use_dev_server: ReturnDevOption('use_dev_server'),
    force_show_postactions: ReturnDevOption('force_show_postactions'),
    MaxJWTexpire: '1556952',
    MaxLengthPosts: '512',
    CurrentBundle: 'light_ng',
    MaximunAPIPayload: '101376'
}