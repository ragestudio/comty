import Core from "vessel/core"

import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import config from "@config"

async function fetchLocale(locale) {
	const mod = await import(`@config/translations/${locale}.json`)

	return mod.default
}

export default class I18nCore extends Core {
	static namespace = "i18n"
	static dependencies = ["settings"]

	static defaultLocale = config.i18n?.defaultLocale ?? "en_US"
	static supportedLanguages = config.i18n?.languages ?? {}
	static supportedLocales = I18nCore.supportedLanguages.map((l) => l.locale)

	onRuntimeEvents = {
		"app:language_changes": (locale) => {
			this.changeLocale(locale)
		},
	}

	async afterInitialize() {
		let locale =
			app.cores.settings.get("app:language") ?? I18nCore.defaultLocale

		if (!I18nCore.supportedLocales.includes(locale)) {
			this.console.warn(
				`Locale ${locale} is not supported, using default locale ${I18nCore.defaultLocale}`,
			)
			locale = I18nCore.defaultLocale
		}

		const translation = await fetchLocale(locale).catch(() => {
			return null
		})

		if (!translation) {
			this.console.error(`Locale ${locale} failed to load!`)

			return null
		}

		i18n.use(initReactI18next).init({
			resources: {
				[locale]: { translation: translation },
			},
			lng: locale,
			interpolation: {
				escapeValue: false,
			},
		})
	}

	async changeLocale(locale = I18nCore.defaultLocale) {
		const translation = await fetchLocale(locale).catch(() => {
			return null
		})

		if (!translation) {
			this.console.error(`Locale ${locale} failed to load!`)

			return null
		}

		i18n.addResourceBundle(locale, "translation", translation)
		i18n.changeLanguage(locale)
	}
}
