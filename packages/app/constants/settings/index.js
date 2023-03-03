import GeneralSettings from "./general"
import ProfileSettings from "./profile"
import SecuritySettings from "./security"
import NotificationsSettings from "./notifications"
import ApparenceSettings from "./apparence"
import ExtensionsSettings from "./extensions"
import SyncSettings from "./sync"
import PlayerSettings from "./player"

import AboutPage from "./about"

export default {
    general: GeneralSettings,
    profile: ProfileSettings,
    apparence: ApparenceSettings,
    player: PlayerSettings,
    security: SecuritySettings,
    notifications: NotificationsSettings,
    extensions: ExtensionsSettings,
    sync: SyncSettings,
    about: AboutPage,
}