import packagejson from "../package.json"
import defaultTheme from "../constants/defaultTheme.json"
import defaultSoundPack from "../constants/defaultSoundPack.json"

export default {
    package: packagejson,
    defaultTheme: defaultTheme,
    defaultSoundPack: defaultSoundPack,
    author: "RageStudio©",
    fundingLink: "https://www.paypal.com/donate/?hosted_button_id=S4TWMAN79KC76",
    githubRepoLink: "https://github.com/ragestudio/comty",
    locations: {
        terms: "/terms",
        privacy: "/privacy",
    },
    legal: {
        //terms: "https://storage.ragestudio.net/rstudio/legal_docs/comty/terms/latest.md",
        privacy: "https://storage.ragestudio.net/rstudio/legal_docs/comty/privacy/latest.md",
    },
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
    app: {
        title: packagejson.name,
        siteName: "Comty™",
        siteDescription: "Comty, a prototype of social network.",
        mainPath: "/",
        authPath: "/auth",
        copyright: "Comty - RageStudio© 2023",
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