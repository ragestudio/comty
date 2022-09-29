import packagejson from "../package.json"
import defaultTheme from "../constants/defaultTheme.json"
import defaultSoundPack from "../constants/defaultSoundPack.json"
import defaultRemotesOrigins from "../constants/defaultRemotesOrigins.json"

const envOrigins = {
    "development": {
        mainApi: `http://${window.location.hostname}:3000`,
        authApi: `http://${window.location.hostname}:4000`,
        contentApi: `http://${window.location.hostname}:3050`,
        streamingApi: `http://${window.location.hostname}:3002`,
    },
    "production": {
        mainApi: "http://api.comty.pw",
        authApi: "http://auth.comty.pw",
        contentApi: "http://content.comty.pw",
        streamingApi: "http://streaming.comty.pw",
    },
    "indev": {
        mainApi: "https://indev_api.comty.pw",
        authApi: `http://indev_auth.comty.pw`,
        contentApi: `http://indev_content.comty.pw`,
        streamingApi: "https://indev_live.comty.pw",
    },
    "nightly": {
        mainApi: "https://nightly_api.comty.pw",
        authApi: `https://nightly_auth.comty.pw`,
        contentApi: `https://nightly_content.comty.pw`,
        streamingApi: "https://nightly_live.comty.pw"
    }
}

console.log(`Config loaded with mode: [${process.env.NODE_ENV}]`)

export default {
    package: packagejson,
    defaultTheme: defaultTheme,
    defaultSoundPack: defaultSoundPack,
    author: "RageStudio©",
    footerLinks: [
        {
            label: "Terms of Service",
            location: "/terms"
        },
        {
            label: "Privacy Policy",
            location: "/privacy"
        },
        {
            label: "Contact",
            location: "/contact"
        },
        {
            label: "Github",
            url: "https://github.com/ragestudio/comty"
        },
        {
            label: "Support this project",
            url: "https://www.paypal.com/donate/?hosted_button_id=S4TWMAN79KC76"
        }
    ],
    logo: {
        alt: "/logo_alt.svg",
        full: "/logo_full.svg",
    },
    remotes: {
        mainApi: process.env.NODE_ENV !== "production" ? envOrigins[process.env.NODE_ENV].mainApi : defaultRemotesOrigins.main_api,
        authApi: process.env.NODE_ENV !== "production" ? envOrigins[process.env.NODE_ENV].authApi : defaultRemotesOrigins.auth_api,
        streamingApi: process.env.NODE_ENV !== "production" ? envOrigins[process.env.NODE_ENV].streamingApi : defaultRemotesOrigins.streaming_api,
    },
    app: {
        title: packagejson.name,
        siteName: "Comty",
        mainPath: "/home",
        copyright: "Comty - RageStudio© 2022",
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