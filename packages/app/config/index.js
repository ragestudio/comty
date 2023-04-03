import packagejson from "../package.json"
import defaultTheme from "../constants/defaultTheme.json"
import defaultSoundPack from "../constants/defaultSoundPack.json"
import defaultRemotesOrigins from "../constants/defaultRemotesOrigins.json"

const envOrigins = {
    "development": {
        mainApi: `http://${window.location.hostname}:3010`,
        messagingApi: `http://${window.location.hostname}:3020`,
    },
    "production": {
        mainApi: "http://api.comty.app",
        messagingApi: `https://messaging_api.comty.app`,
    },
    "indev": {
        mainApi: "https://indev_api.comty.app",
    },
    "nightly": {
        mainApi: "https://nightly_api.comty.app",
    }
}

console.log(`Config loaded with mode: [${process.env.NODE_ENV}]`)

export default {
    package: packagejson,
    defaultTheme: defaultTheme,
    defaultSoundPack: defaultSoundPack,
    author: "RageStudio©",
    fundingLink: "https://www.paypal.com/donate/?hosted_button_id=S4TWMAN79KC76",
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
        alt: "https://storage.ragestudio.net/rstudio/branding/comty/iso/logo_alt.svg",
        full: "https://storage.ragestudio.net/rstudio/branding/comty/labeled/logo_full.svg",
        ragestudio_alt: "https://storage.ragestudio.net/rstudio/branding/ragestudio/iso/ragestudio.svg",
        ragestudio_full: "https://storage.ragestudio.net/rstudio/branding/ragestudio/labeled/ragestudio-labeled_white.svg",
    },
    remotes: {
        mainApi: process.env.NODE_ENV !== "production" ? envOrigins[process.env.NODE_ENV].mainApi : defaultRemotesOrigins.main_api,
        messagingApi: process.env.NODE_ENV !== "production" ? envOrigins[process.env.NODE_ENV].messagingApi : defaultRemotesOrigins.messagingApi,
    },
    app: {
        title: packagejson.name,
        siteName: "Comty™",
        siteDescription: "Comty, a prototype of social network.",
        mainPath: "/",
        authPath: "/login",
        copyright: "Comty - RageStudio© 2023",
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