import SettingsCore from "./settings"
import APICore from "./api"
import StyleCore from "./style"
import Render from "./render"

import I18nCore from "./i18n"
import NotificationsCore from "./notifications"
import ShortcutsCore from "./shortcuts"
import SoundCore from "./sound"

// DEFINE LOAD ORDER HERE
export default [
    SettingsCore,
    APICore,
    StyleCore,
    I18nCore,
    SoundCore,
    NotificationsCore,
    ShortcutsCore,
    Render,
]