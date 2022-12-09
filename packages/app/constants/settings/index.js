import AppSettings from "./app"
import ProfileSettings from "./profile"
import SecuritySettings from "./security"
import NotificationsSettings from "./notifications"
import ApparenceSettings from "./apparence"
//import ExtensionsSettings from "./extensions"

export default {
    app: {
        icon: "Command",
        label: "App",
        settings: AppSettings
    },
    profile: {
        icon: "User",
        label: "Profile",
        settings: ProfileSettings
    },
    apparence: {
        icon: "Eye",
        label: "Apparence",
        settings: ApparenceSettings
    },
    security: {
        icon: "Shield",
        label: "Security",
        settings: SecuritySettings
    },
    notifications: {
        icon: "Bell",
        label: "Notifications",
        settings: NotificationsSettings
    },
}