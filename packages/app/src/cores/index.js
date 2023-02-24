import SettingsCore from "./settings"
import APICore from "./api"
import StyleCore from "./style"
import PermissionsCore from "./permissions"
import ContextMenuCore from "./contextMenu"

import I18nCore from "./i18n"
import NotificationsCore from "./notifications"
import ShortcutsCore from "./shortcuts"
import SoundCore from "./sound"

import Player from "./player"

// DEFINE LOAD ORDER HERE
export default [
    SettingsCore,
    APICore,
    PermissionsCore,
    StyleCore,
    I18nCore,
    SoundCore,
    NotificationsCore,
    ShortcutsCore,

    Player,
    ContextMenuCore,
]