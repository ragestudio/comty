import SettingsCore from "./settings"
import APICore from "./api"
import StyleCore from "./style"
import PermissionsCore from "./permissions"
import SearchCore from "./search"
import ContextMenuCore from "./contextMenu"

import I18nCore from "./i18n"
import NotificationsCore from "./notifications"
import ShortcutsCore from "./shortcuts"
import SoundCore from "./sound"

import AudioPlayer from "./audioPlayer"

// DEFINE LOAD ORDER HERE
export default [
    SettingsCore,
    APICore,
    SearchCore,
    PermissionsCore,
    StyleCore,
    I18nCore,
    SoundCore,
    NotificationsCore,
    ShortcutsCore,

    AudioPlayer,
    ContextMenuCore,
]