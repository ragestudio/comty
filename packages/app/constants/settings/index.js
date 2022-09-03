import AppSettings from "./app"
import AccountSettings from "./account"
import ApparenceSettings from "./apparence"
import ExtensionsSettings from "./extensions"

export default {
    app: {
        icon: "Command",
        label: "App",
        settings: AppSettings
    },
    account: {
        icon: "User",
        label: "Account",
        settings: AccountSettings
    },
    apparence: {
        icon: "Eye",
        label: "Apparence",
        settings: ApparenceSettings
    },
    extensions: {
        icon: "MdOutlineWidgets",
        label: "Extensions",
        settings: ExtensionsSettings
    }
}