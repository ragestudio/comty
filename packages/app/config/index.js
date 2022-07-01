import packagejson from "../package.json"
import defaultTheme from "../constants/defaultTheme.json"
import defaultSoundPack from "../constants/defaultSoundPack.json"
import defaultRemotesOrigins from "../constants/defaultRemotesOrigins.json"

const envOrigins = {
    "development": {
        mainApi: `http://${window.location.hostname}:3000`,
        websocketApi: `ws://${window.location.hostname}:3001`,
        streamingApi: `http://${window.location.hostname}:3002`,
    },
    "indev": {
        mainApi: "https://indev_api.comty.pw",
        websocketApi: "wss://indev_ws.comty.pw",
        streamingApi: "https://indev_live.comty.pw",
    },
    "nightly": {
        mainApi: "https://nightly_api.comty.pw",
        websocketApi: "wss://nightly_ws.comty.pw",
        streamingApi: "https://nightly_live.comty.pw"
    }
}

console.log(`Config loaded with mode: [${process.env.NODE_ENV}]`)

export default {
    package: packagejson,
    defaultTheme: defaultTheme,
    defaultSoundPack: defaultSoundPack,
    author: "RageStudio© 2022",
    logo: {
        alt: "/logo_alt.svg",
        full: "/logo_full.svg",
    },
    remotes: {
        mainApi: process.env.NODE_ENV !== "production" ? envOrigins[process.env.NODE_ENV].mainApi : defaultRemotesOrigins.main_api,
        websocketApi: process.env.NODE_ENV !== "production" ? envOrigins[process.env.NODE_ENV].websocketApi : defaultRemotesOrigins.websocket_api,
        streamingApi: process.env.NODE_ENV !== "production" ? envOrigins[process.env.NODE_ENV].streamingApi : defaultRemotesOrigins.streaming_api,
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
        defaultLocale: "en",
    }
}