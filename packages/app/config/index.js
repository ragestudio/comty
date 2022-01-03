import packagejson from "../package.json"
import defaultTheme from "../constants/defaultTheme.json"
import defaultSoundPack from "../constants/defaultSoundPack.json"

export default {
    package: packagejson,
    defaultTheme: defaultTheme,
    defaultSoundPack: defaultSoundPack,
    logo: {
        alt: "/logo_alt.svg"
    },
    api: {
        address: process.env.NODE_ENV !== 'production' ? `http://${window.location.hostname}:3000` : "https://api.amimet.es",
    },
    ws: {
        address: process.env.NODE_ENV !== 'production' ? `ws://${window.location.hostname}:3001` : "https://ws.amimet.es",
    },
    app: {
        title: packagejson.name,
        siteName: "Comty",
        mainPath: '/main',
        storage: {
            basics: "user",
            token: "token",
            session_frame: "session",
            signkey: "certified",
            settings: "app_settings"
        },
    },
    i18n: {
        languages: [
            {
                key: 'en',
                title: 'English',
            },
            {
                key: 'es',
                title: 'Español',
            }
        ],
        defaultLanguage: 'en',
    }
}