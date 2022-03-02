import packagejson from "../package.json"
import defaultTheme from "../constants/defaultTheme.json"
import defaultSoundPack from "../constants/defaultSoundPack.json"
import defaultRemotesOrigins from "../constants/defaultRemotesOrigins.json"

export default {
    package: packagejson,
    defaultTheme: defaultTheme,
    defaultSoundPack: defaultSoundPack,
    author: "RageStudio© 2022",
    logo: {
        alt: "/logo_alt.svg"
    },
    api: {
        address: defaultRemotesOrigins.http_api,//process.env.NODE_ENV !== "production" ? `http://${window.location.hostname}:3000` : defaultRemotesOrigins.http_api,
    },
    ws: {
        address: defaultRemotesOrigins.ws_api, //process.env.NODE_ENV !== "production" ? `ws://${window.location.hostname}:3001` : defaultRemotesOrigins.ws_api,
    },
    app: {
        title: packagejson.name,
        siteName: "Comty",
        mainPath: "/main",
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
                locale: "en",
                name: "English"
            },
            {
                locale: "es",
                name: "Español"
            }
        ],
        defaultLocale: "es",
    }
}