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
    SignForNotExpire: ReturnDevOption('force_showDevLogs'),
    MaxJWTexpire: '1556952',
    MaxLengthPosts: '512',
    CurrentBundle: 'light_ng'
}