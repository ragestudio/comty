import packagejson from "../package.json"
import defaultTheme from "../constants/defaultTheme.json"
import defaultSoundPack from "../constants/defaultSoundPack.json"
import defaultRemotesOrigins from "../constants/defaultRemotesOrigins.json"

const envOrigins = {
    "development": {
        mainApi: `http://${window.location.hostname}:3000`,
        messagingApi: `http://${window.location.hostname}:3020`,
    },
    "production": {
        mainApi: "http://api.comty.pw",
        messagingApi: `http://api.comty.pw/messaging`,
    },
    "indev": {
        mainApi: "https://indev_api.comty.pw",
    },
    "nightly": {
        mainApi: "https://nightly_api.comty.pw",
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
        messagingApi: process.env.NODE_ENV !== "production" ? envOrigins[process.env.NODE_ENV].messagingApi : defaultRemotesOrigins.messagingApi,
    },
    app: {
        title: packagejson.name,
        siteName: "Comty™",
        siteDescription: "Comty, a prototype of social network.",
        mainPath: "/home",
        authPath: "/login",
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