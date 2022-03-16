import { Extension } from "evite"
import config from "config"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

export const SUPPORTED_LANGUAGES = config.i18n?.languages ?? {}
export const SUPPORTED_LOCALES = SUPPORTED_LANGUAGES.map((l) => l.locale)
export const DEFAULT_LOCALE = config.i18n?.defaultLocale

export function extractLocaleFromPath(path = "") {
    const [_, maybeLocale] = path.split("/")
    return SUPPORTED_LOCALES.includes(maybeLocale) ? maybeLocale : DEFAULT_LOCALE
}

const messageImports = import.meta.glob("./translations/*.json")

export default class I18nExtension extends Extension {
    depends = ["SettingsExtension"]

    importLocale = async (locale) => {
        const [, importLocale] =
            Object.entries(messageImports).find(([key]) =>
                key.includes(`/${locale}.`)
            ) || []

        return importLocale && importLocale()
    }

    loadAsyncLanguage = async function (locale) {
        locale = locale ?? DEFAULT_LOCALE

        try {
            const result = await this.importLocale(locale)

            if (result) {
                i18n.addResourceBundle(locale, "translation", result.default || result)
                i18n.changeLanguage(locale)
            }
        } catch (error) {
            console.error(error)
        }
    }

    initializers = [
        async () => {
            let locale = app.settings.get("language") ?? DEFAULT_LOCALE

            if (!SUPPORTED_LOCALES.includes(locale)) {
                locale = DEFAULT_LOCALE
            }

            const messages = await this.importLocale(locale)

            i18n
                .use(initReactI18next) // passes i18n down to react-i18next
                .init({
                    // debug: true,
                    resources: {
                        [locale]: { translation: messages.default || messages },
                    },
                    lng: locale,
                    //fallbackLng: DEFAULT_LOCALE,
                    interpolation: {
                        escapeValue: false, // react already safes from xss
                    },
                })

            this.mainContext.eventBus.on("changeLanguage", (locale) => {
                this.loadAsyncLanguage(locale)
            })
        },
    ]
}